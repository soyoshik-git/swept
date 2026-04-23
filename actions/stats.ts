"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardData, Stats } from "@/types/database";

export type ScheduleTask = {
  id: string;
  name: string;
  space: string | null;
  base_point: number;
  frequency_days: number;
  stale_days: number;
  last_completed_at: string | null;
  created_at: string;
  is_fixed_assign: boolean;
  is_mine: boolean;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
};

export type WeekCompletion = {
  id: string;
  task_id: string;
  completed_at: string;
  task_name: string;
  user_name: string;
};

export type WeeklyScheduleData = {
  tasks: ScheduleTask[];
  weekCompletions: WeekCompletion[];
};

export async function getAllCompletions(page = 0, pageSize = 50) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) return [];

  const { data: taskIds } = await supabase
    .from("tasks")
    .select("id")
    .eq("room_id", member.room_id);

  const ids = (taskIds ?? []).map((t) => t.id);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("completions")
    .select("*, task:tasks(*), user:users(*)")
    .in("task_id", ids)
    .order("completed_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  return data ?? [];
}

export async function getWeeklySchedule(): Promise<WeeklyScheduleData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tasks: [], weekCompletions: [] };

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) return { tasks: [], weekCompletions: [] };

  const now = new Date();

  // 今週月曜日の0:00を取得
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // タスク一覧
  const { data: tasksRaw } = await supabase
    .from("tasks")
    .select("id, name, space, base_point, frequency_days, is_fixed_assign, assigned_user_id, created_at")
    .eq("room_id", member.room_id)
    .eq("is_active", true);

  const taskIds = (tasksRaw ?? []).map((t) => t.id);

  // 担当ユーザー名をまとめて取得
  const assignedUserIds = [
    ...new Set(
      (tasksRaw ?? [])
        .map((t) => t.assigned_user_id)
        .filter((id): id is string => !!id)
    ),
  ];
  const { data: assignedUsers } = assignedUserIds.length
    ? await supabase.from("users").select("id, name").in("id", assignedUserIds)
    : { data: [] };
  const userMap = Object.fromEntries(
    (assignedUsers ?? []).map((u) => [u.id, u.name])
  );

  // 各タスクの最終完了日時 → stale_days・due_date を計算
  const tasks: ScheduleTask[] = await Promise.all(
    (tasksRaw ?? []).map(async (task) => {
      const { data: last } = await supabase
        .from("completions")
        .select("completed_at")
        .eq("task_id", task.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const staleDays = last
        ? Math.floor(
            (now.getTime() - new Date(last.completed_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;

      // 期限日 = 最終完了日（なければ作成日）+ 推奨頻度
      const baseDate = last
        ? new Date(last.completed_at)
        : new Date(task.created_at);
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + task.frequency_days);
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      return {
        id: task.id,
        name: task.name,
        space: task.space,
        base_point: task.base_point,
        frequency_days: task.frequency_days,
        stale_days: staleDays,
        last_completed_at: last?.completed_at ?? null,
        created_at: task.created_at,
        is_fixed_assign: task.is_fixed_assign ?? false,
        is_mine:
          task.is_fixed_assign === true && task.assigned_user_id === user.id,
        assigned_user_id: task.assigned_user_id,
        assigned_user_name: task.assigned_user_id
          ? (userMap[task.assigned_user_id] ?? null)
          : null,
      };
    })
  );

  // 今週の完了履歴
  const { data: weekCompletionsRaw } = taskIds.length
    ? await supabase
        .from("completions")
        .select("id, task_id, completed_at, task:tasks(name), user:users(name)")
        .in("task_id", taskIds)
        .gte("completed_at", monday.toISOString())
        .order("completed_at", { ascending: false })
    : { data: [] };

  const weekCompletions: WeekCompletion[] = (weekCompletionsRaw ?? []).map(
    (c) => ({
      id: c.id,
      task_id: c.task_id,
      completed_at: c.completed_at,
      task_name: (c.task as unknown as { name: string } | null)?.name ?? "",
      user_name: (c.user as unknown as { name: string } | null)?.name ?? "",
    })
  );

  return { tasks, weekCompletions };
}

export async function getMonthlyStats(
  year: number,
  month: number,
): Promise<Stats[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) throw new Error("Room not found");

  const { data, error } = await supabase
    .from("monthly_stats")
    .select("*, user:users(*)")
    .eq("room_id", member.room_id)
    .eq("year", year)
    .eq("month", month)
    .order("net_point", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();

  if (!member?.room_id) {
    return { monthlyStats: [], tasks: [], recentCompletions: [], completionCount: 0, myTotalPoint: 0, myPenaltyCount: 0, myRank: 0, overdueCount: 0 };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1).toISOString();

  // 並列取得
  const [
    { data: monthlyStats },
    { data: tasksRaw },
    { count: completionCount },
    { count: myPenaltyCount },
  ] = await Promise.all([
    supabase
      .from("monthly_stats")
      .select("*, user:users(*)")
      .eq("room_id", member.room_id)
      .eq("year", year)
      .eq("month", month)
      .order("net_point", { ascending: false }),

    supabase
      .from("tasks")
      .select("*")
      .eq("room_id", member.room_id)
      .eq("is_active", true),

    // 自分の今月完了数
    supabase
      .from("completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", monthStart),

    // 自分の今月ペナルティ回数
    supabase
      .from("completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_penalized", true)
      .gte("completed_at", monthStart),
  ]);

  // 放置日数を計算
  const tasks = await Promise.all(
    (tasksRaw ?? []).map(async (task) => {
      const { data: lastCompletion } = await supabase
        .from("completions")
        .select("completed_at")
        .eq("task_id", task.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const staleDays = lastCompletion
        ? Math.floor(
            (now.getTime() - new Date(lastCompletion.completed_at).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      return {
        ...task,
        last_completed_at: lastCompletion?.completed_at ?? null,
        stale_days: staleDays,
      };
    }),
  );

  tasks.sort((a, b) => b.stale_days - a.stale_days);

  const overdueCount = tasks.filter(
    (t) => t.stale_days >= t.frequency_days * 2,
  ).length;

  const taskIds = (tasksRaw ?? []).map((t) => t.id);

  const [{ data: recentCompletions }, { data: monthlyCompletionsRaw }] =
    await Promise.all([
      taskIds.length
        ? supabase
            .from("completions")
            .select("*, task:tasks(*), user:users(*)")
            .in("task_id", taskIds)
            .order("completed_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),
      // ユーザーごとの今月完了タスク数
      taskIds.length
        ? supabase
            .from("completions")
            .select("user_id")
            .in("task_id", taskIds)
            .gte("completed_at", monthStart)
        : Promise.resolve({ data: [] }),
    ]);

  // user_id ごとにカウント
  const taskCountByUser: Record<string, number> = {};
  for (const c of monthlyCompletionsRaw ?? []) {
    taskCountByUser[c.user_id] = (taskCountByUser[c.user_id] ?? 0) + 1;
  }

  const statsWithCount = (monthlyStats ?? []).map((s) => ({
    ...s,
    task_count: taskCountByUser[s.user_id] ?? 0,
  }));

  // 自分の今月ポイントと順位
  const myStatIndex = statsWithCount.findIndex((s) => s.user_id === user.id);
  const myTotalPoint = myStatIndex >= 0 ? statsWithCount[myStatIndex].net_point : 0;
  const myRank = myStatIndex >= 0 ? myStatIndex + 1 : 0;

  return {
    monthlyStats: statsWithCount as Stats[],
    tasks,
    recentCompletions: recentCompletions ?? [],
    completionCount: completionCount ?? 0,
    myTotalPoint,
    myPenaltyCount: myPenaltyCount ?? 0,
    myRank,
    overdueCount,
  };
}
