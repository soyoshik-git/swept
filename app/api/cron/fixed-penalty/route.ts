import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 毎日実行（JST 0:00 = UTC 15:00）
 * 固定担当タスクのペナルティ判定
 *  - 期限（日数）タスク: frequency_days 以内に未完了 → ペナルティ
 *  - 曜日タスク: 昨日が指定曜日で未完了 → ペナルティ
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // JST "昨日" の日付を計算
  const nowUtc = new Date();
  const nowJst = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  const yesterday = new Date(nowJst);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDow = yesterday.getDay(); // 0=日,1=月,...,6=土
  const yesterdayStr = yesterday.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const year = nowJst.getFullYear();
  const month = nowJst.getMonth() + 1;

  // 固定担当タスクを全取得（weekdays カラム含む）
  const { data: fixedTasks } = await admin
    .from("tasks")
    .select("id, base_point, frequency_days, weekdays, assigned_user_id, room_id")
    .eq("is_fixed_assign", true)
    .eq("is_active", true)
    .not("assigned_user_id", "is", null);

  let penaltiesApplied = 0;

  for (const task of fixedTasks ?? []) {
    const userId = task.assigned_user_id!;
    const weekdays: number[] = (task.weekdays as number[] | null) ?? [];

    // ─── 曜日タスク ───
    if (weekdays.length > 0) {
      // 昨日が指定曜日でなければスキップ
      if (!weekdays.includes(yesterdayDow)) continue;

      // 昨日分のペナルティが既に記録済みかチェック
      const { data: existing } = await admin
        .from("fixed_task_penalties")
        .select("id")
        .eq("task_id", task.id)
        .eq("user_id", userId)
        .eq("penalty_date", yesterdayStr)
        .maybeSingle();
      if (existing) continue;

      // 昨日中に完了したか確認
      const yesterdayStart = `${yesterdayStr}T00:00:00+09:00`;
      const yesterdayEnd = `${yesterdayStr}T23:59:59+09:00`;
      const { data: completion } = await admin
        .from("completions")
        .select("id")
        .eq("task_id", task.id)
        .gte("completed_at", yesterdayStart)
        .lte("completed_at", yesterdayEnd)
        .maybeSingle();

      if (completion) continue; // 完了済みならOK

      // ペナルティ記録
      const { error: insertError } = await admin
        .from("fixed_task_penalties")
        .insert({
          task_id: task.id,
          user_id: userId,
          year,
          month,
          penalty_period: 0, // 曜日タスクでは未使用
          penalty_date: yesterdayStr,
          base_point: task.base_point,
        });
      if (insertError) continue;

      await applyPenaltyToStats(admin, userId, task.room_id, task.base_point, year, month);
      penaltiesApplied++;
      continue;
    }

    // ─── 期限（日数）タスク ───
    const { data: lastCompletion } = await admin
      .from("completions")
      .select("completed_at")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: taskMeta } = await admin
      .from("tasks")
      .select("created_at")
      .eq("id", task.id)
      .single();

    const baseDate = lastCompletion
      ? new Date(lastCompletion.completed_at)
      : new Date(taskMeta?.created_at ?? nowJst);

    const staleDays = Math.floor(
      (nowJst.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const penaltyPeriodsDue = Math.floor(staleDays / task.frequency_days);
    if (penaltyPeriodsDue === 0) continue;

    const { data: existingPenalties } = await admin
      .from("fixed_task_penalties")
      .select("penalty_period")
      .eq("task_id", task.id)
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month);

    const recordedPeriods = new Set((existingPenalties ?? []).map((p) => p.penalty_period));

    for (let period = 1; period <= penaltyPeriodsDue; period++) {
      if (recordedPeriods.has(period)) continue;

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
      if (insertError) continue;

      await applyPenaltyToStats(admin, userId, task.room_id, task.base_point, year, month);
      penaltiesApplied++;
    }
  }

  return NextResponse.json({ ok: true, penaltiesApplied, checkedAt: nowJst.toISOString() });
}

async function applyPenaltyToStats(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  roomId: string,
  basePoint: number,
  year: number,
  month: number,
) {
  const { data: stat } = await admin
    .from("monthly_stats")
    .select("id, total_point, penalty_pt")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (stat) {
    const newPenalty = (stat.penalty_pt ?? 0) + basePoint;
    const newNet = Math.max(0, (stat.total_point ?? 0) - newPenalty);
    await admin
      .from("monthly_stats")
      .update({ penalty_pt: newPenalty, net_point: newNet })
      .eq("id", stat.id);
  } else {
    await admin.from("monthly_stats").insert({
      room_id: roomId,
      user_id: userId,
      year,
      month,
      total_point: 0,
      penalty_pt: basePoint,
      net_point: 0,
    });
  }
}
