import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 毎日実行: 固定担当タスクの期限切れペナルティを計算してmonthly_statsに反映
 * 期限 = frequency_days日以内に完了しなかった場合、base_point分マイナス
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 固定担当タスクを全取得
  const { data: fixedTasks } = await admin
    .from("tasks")
    .select("id, base_point, frequency_days, assigned_user_id, room_id")
    .eq("is_fixed_assign", true)
    .eq("is_active", true)
    .not("assigned_user_id", "is", null);

  let penaltiesApplied = 0;

  for (const task of fixedTasks ?? []) {
    const userId = task.assigned_user_id!;

    // 最後の完了日を取得
    const { data: lastCompletion } = await admin
      .from("completions")
      .select("completed_at")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const baseDate = lastCompletion
      ? new Date(lastCompletion.completed_at)
      : (() => {
          // タスク作成日を取得
          return now;
        })();

    const staleDays = Math.floor(
      (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 何回分のペナルティが発生しているか
    const penaltyPeriodsDue = Math.floor(staleDays / task.frequency_days);
    if (penaltyPeriodsDue === 0) continue;

    // 既に記録済みのペナルティ期間数を確認
    const { data: existingPenalties } = await admin
      .from("fixed_task_penalties")
      .select("penalty_period")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month);

    const recordedPeriods = new Set((existingPenalties ?? []).map((p) => p.penalty_period));

    // 未記録の期間についてペナルティを付与
    for (let period = 1; period <= penaltyPeriodsDue; period++) {
      if (recordedPeriods.has(period)) continue;

      // fixed_task_penaltiesに記録
      const { error: insertError } = await admin
        .from("fixed_task_penalties")
        .insert({
          task_id: task.id,
          user_id: userId,
          year,
          month,
          penalty_period: period,
          base_point: task.base_point,
        });

      if (insertError) continue; // 重複などはスキップ

      // monthly_stats の penalty_pt を更新
      const { data: stat } = await admin
        .from("monthly_stats")
        .select("id, total_point, penalty_pt")
        .eq("user_id", userId)
        .eq("room_id", task.room_id)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (stat) {
        const newPenalty = (stat.penalty_pt ?? 0) + task.base_point;
        const newNet = Math.max(0, (stat.total_point ?? 0) - newPenalty);
        await admin
          .from("monthly_stats")
          .update({ penalty_pt: newPenalty, net_point: newNet })
          .eq("id", stat.id);
      } else {
        // stat がなければ新規作成
        await admin.from("monthly_stats").insert({
          room_id: task.room_id,
          user_id: userId,
          year,
          month,
          total_point: 0,
          penalty_pt: task.base_point,
          net_point: -task.base_point < 0 ? 0 : -task.base_point,
        });
      }

      penaltiesApplied++;
    }
  }

  return NextResponse.json({ ok: true, penaltiesApplied, checkedAt: now.toISOString() });
}
