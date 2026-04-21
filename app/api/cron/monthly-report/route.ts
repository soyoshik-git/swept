import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcPenalty } from "@/lib/points";
import { buildMonthlyReportMessage, pushMessage } from "@/lib/line";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 全ルームを取得
  const { data: rooms } = await supabase.from("rooms").select("*");

  for (const room of rooms ?? []) {
    const { data: members } = await supabase
      .from("users")
      .select("id, name")
      .eq("room_id", room.id);

    if (!members?.length) continue;

    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

    for (const member of members) {
      // 今月の完了ポイントを集計
      const { data: completions } = await supabase
        .from("completions")
        .select("final_point, base_point")
        .eq("user_id", member.id)
        .gte("completed_at", startOfMonth)
        .lte("completed_at", endOfMonth);

      const totalPoint = (completions ?? []).reduce(
        (sum, c) => sum + (c.final_point ?? c.base_point),
        0,
      );

      // 固定担当タスクのペナルティを集計
      const { data: fixedTasks } = await supabase
        .from("tasks")
        .select("id, base_point, frequency_days")
        .eq("room_id", room.id)
        .eq("assigned_user_id", member.id)
        .eq("is_fixed_assign", true)
        .eq("is_active", true);

      let penaltyPt = 0;
      for (const task of fixedTasks ?? []) {
        const { data: taskCompletions } = await supabase
          .from("completions")
          .select("completed_at")
          .eq("task_id", task.id)
          .eq("user_id", member.id)
          .gte("completed_at", startOfMonth)
          .lte("completed_at", endOfMonth)
          .order("completed_at", { ascending: true });

        const daysInMonth = new Date(year, month, 0).getDate();
        const expectedCount = Math.floor(daysInMonth / task.frequency_days);
        const actualCount = taskCompletions?.length ?? 0;
        const overdue = Math.max(0, expectedCount - actualCount);

        for (let i = 0; i < overdue; i++) {
          penaltyPt += Math.abs(calcPenalty(task.base_point));
        }
      }

      const netPoint = Math.max(0, totalPoint - penaltyPt);

      // monthly_statsをupsert
      await supabase.from("monthly_stats").upsert(
        {
          room_id: room.id,
          user_id: member.id,
          year,
          month,
          total_point: totalPoint,
          penalty_pt: penaltyPt,
          net_point: netPoint,
        },
        { onConflict: "room_id,user_id,year,month" },
      );
    }

    // LINEグループにレポートを送信
    if (room.line_group_id) {
      const { data: stats } = await supabase
        .from("monthly_stats")
        .select("net_point, user:users(name)")
        .eq("room_id", room.id)
        .eq("year", year)
        .eq("month", month)
        .order("net_point", { ascending: false });

      const rankings = (stats ?? []).map((s) => ({
        name: (s.user as unknown as { name: string }).name,
        point: s.net_point,
      }));

      const message = buildMonthlyReportMessage(month, rankings);
      await pushMessage(room.line_group_id, message).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true, year, month });
}
