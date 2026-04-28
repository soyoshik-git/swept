import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDailyReminderMessage, pushMessage } from "@/lib/line";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // JST の今日の曜日を取得（0=日, 1=月, ..., 6=土）
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayWeekday = nowJST.getUTCDay();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, line_group_id")
    .not("line_group_id", "is", null);

  for (const room of rooms ?? []) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("name, assigned_user_id, weekdays, users:assigned_user_id(name)")
      .eq("room_id", room.id)
      .eq("is_fixed_assign", true)
      .eq("is_active", true)
      .not("assigned_user_id", "is", null)
      .not("weekdays", "is", null);

    const todayTasks = (tasks ?? []).filter(
      (t) => Array.isArray(t.weekdays) && t.weekdays.includes(todayWeekday),
    );

    if (!todayTasks.length) continue;

    const items = todayTasks.map((t) => ({
      userName: (t.users as unknown as { name: string } | null)?.name ?? "不明",
      taskName: t.name,
    }));

    const message = buildDailyReminderMessage(items);
    await pushMessage(room.line_group_id!, message).catch(console.error);
  }

  return NextResponse.json({ ok: true, weekday: todayWeekday });
}
