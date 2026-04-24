import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  if (process.env.DEV_LOGIN_ENABLED !== "true") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }

  const admin = createAdminClient();

  // 開発デモ部屋を取得
  const { data: room } = await admin
    .from("rooms")
    .select("id")
    .eq("name", "開発デモ部屋")
    .single();

  if (!room) {
    return NextResponse.json({ error: "dev room not found. Please login as dev first." }, { status: 404 });
  }

  const roomId = room.id;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // ---- ダミーユーザーを作成 ----
  const dummyUsers = [
    { name: "田中 太郎", email: "tanaka@demo.test" },
    { name: "佐藤 花子", email: "sato@demo.test" },
    { name: "鈴木 一郎", email: "suzuki@demo.test" },
  ];

  const userIds: string[] = [];
  for (const u of dummyUsers) {
    // auth.usersに追加（存在する場合は skip）
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("name", u.name)
      .eq("room_id", roomId)
      .maybeSingle();

    if (existing) {
      userIds.push(existing.id);
      continue;
    }

    // auth ユーザー作成
    const { data: authUser } = await admin.auth.admin.createUser({
      email: u.email,
      password: "password123",
      email_confirm: true,
    });

    if (!authUser.user) continue;

    // users テーブルに追加
    await admin.from("users").upsert({
      id: authUser.user.id,
      name: u.name,
      room_id: roomId,
    });
    userIds.push(authUser.user.id);
  }

  // ---- タスクを作成 ----
  const taskDefs = [
    { name: "換気扇の掃除", space: "キッチン", base_point: 30, frequency_days: 14 },
    { name: "窓拭き", space: "リビング", base_point: 20, frequency_days: 10 },
    { name: "排水口の掃除", space: "バスルーム", base_point: 25, frequency_days: 7 },
    { name: "冷蔵庫の整理", space: "キッチン", base_point: 15, frequency_days: 5 },
    { name: "トイレ掃除", space: "トイレ", base_point: 20, frequency_days: 3 },
    { name: "床掃除", space: "リビング", base_point: 10, frequency_days: 2 },
  ];

  const { data: existingTasks } = await admin
    .from("tasks")
    .select("id, name")
    .eq("room_id", roomId)
    .eq("is_active", true);

  const taskIds: string[] = [];

  for (const td of taskDefs) {
    const exists = existingTasks?.find((t) => t.name === td.name);
    if (exists) {
      taskIds.push(exists.id);
      continue;
    }
    const { data: task } = await admin
      .from("tasks")
      .insert({ ...td, room_id: roomId, is_active: true, is_fixed_assign: false })
      .select("id")
      .single();
    if (task) taskIds.push(task.id);
  }

  // ---- 完了履歴を作成（最近10日分） ----
  const completionInserts = [];
  const recent = [
    { taskIdx: 4, userIdx: 0, daysAgo: 0, hoursAgo: 0 },  // トイレ掃除（今日）
    { taskIdx: 5, userIdx: 1, daysAgo: 0, hoursAgo: 2 },  // 床掃除
    { taskIdx: 2, userIdx: 2, daysAgo: 1, hoursAgo: 3 },  // 排水口
    { taskIdx: 4, userIdx: 1, daysAgo: 2, hoursAgo: 1 },  // トイレ
    { taskIdx: 5, userIdx: 0, daysAgo: 2, hoursAgo: 4 },  // 床
    { taskIdx: 4, userIdx: 2, daysAgo: 4, hoursAgo: 2 },  // トイレ
    { taskIdx: 5, userIdx: 1, daysAgo: 5, hoursAgo: 1 },  // 床
    { taskIdx: 4, userIdx: 0, daysAgo: 6, hoursAgo: 3 },  // トイレ
    { taskIdx: 5, userIdx: 2, daysAgo: 7, hoursAgo: 2 },  // 床
    { taskIdx: 2, userIdx: 0, daysAgo: 8, hoursAgo: 5 },  // 排水口
  ];

  for (const r of recent) {
    if (r.taskIdx >= taskIds.length || r.userIdx >= userIds.length) continue;
    const completedAt = new Date(now);
    completedAt.setDate(completedAt.getDate() - r.daysAgo);
    completedAt.setHours(completedAt.getHours() - r.hoursAgo);

    const task = taskDefs[r.taskIdx];
    completionInserts.push({
      task_id: taskIds[r.taskIdx],
      user_id: userIds[r.userIdx],
      completed_at: completedAt.toISOString(),
      base_point: task.base_point,
      stale_days: r.daysAgo,
      final_point: task.base_point + Math.floor(r.daysAgo * 2),
      is_penalized: false,
    });
  }

  if (completionInserts.length > 0) {
    await admin.from("completions").insert(completionInserts);
  }

  // ---- 月次統計を upsert ----
  const statsData = [
    { userIdx: 0, total_point: 450, penalty_pt: 0, net_point: 450 },
    { userIdx: 1, total_point: 420, penalty_pt: 0, net_point: 420 },
    { userIdx: 2, total_point: 360, penalty_pt: 10, net_point: 350 },
  ];

  for (const s of statsData) {
    if (s.userIdx >= userIds.length) continue;
    await admin.from("monthly_stats").upsert(
      {
        room_id: roomId,
        user_id: userIds[s.userIdx],
        year,
        month,
        total_point: s.total_point,
        penalty_pt: s.penalty_pt,
        net_point: s.net_point,
      },
      { onConflict: "room_id,user_id,year,month" },
    );
  }

  return NextResponse.json({
    ok: true,
    room_id: roomId,
    users: userIds.length,
    tasks: taskIds.length,
    completions: completionInserts.length,
  });
}
