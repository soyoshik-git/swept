"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardData, Stats, CompletionWithRelations, User } from "@/types/database";

export type ScheduleTask = {
  id: string;
  name: string;
  space: string | null;
  base_point: number;
  frequency_days: number;
  weekdays: number[];   // [] = 頻度タスク、非空 = 曜日タスク
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

/** task_id[] を受け取り、各タスクの最終完了日時マップを1クエリで返す */
async function fetchLastCompletionMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskIds: string[],
): Promise<Record<string, string>> {
  if (!taskIds.length) return {};
  const { data } = await supabase
    .from("completions")
    .select("task_id, completed_at")
    .in("task_id", taskIds)
    .order("completed_at", { ascending: false });

  const map: Record<string, string> = {};
  for (const c of data ?? []) {
    if (!map[c.task_id]) map[c.task_id] = c.completed_at; // 最新1件のみ保持
  }
  return map;
}

/**
 * 曜日タスクの stale_days を計算
 * 「前回の指定曜日（過去7日以内）」からの経過日数を返す
 * 前回の指定曜日以降に完了済みなら 0 を返す
 */
function calcWeekdayStaleDays(
  weekdays: number[],
  lastCompletedAt: string | null,
  now: Date,
  gracePeriodHours = 0,
): number {
  // 過去7日間で最も直近の指定曜日を探す
  let lastScheduledDate: Date | null = null;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    if (weekdays.includes(d.getDay())) {
      lastScheduledDate = d;
      break;
    }
  }
  if (!lastScheduledDate) return 0;

  // 猶予期間内（指定曜日の翌日8時まで）はまだ放置扱いにしない
  const graceDeadline = new Date(lastScheduledDate.getTime() + gracePeriodHours * 3600 * 1000);
  if (now < graceDeadline) return 0;

  // 最後の完了が「前回の指定曜日」以降なら完了済み → stale_days = 0
  if (lastCompletedAt) {
    const lastDone = new Date(lastCompletedAt);
    if (lastDone >= lastScheduledDate) return 0;
  }

  // 完了していない → 前回指定曜日からの日数
  return Math.floor((now.getTime() - lastScheduledDate.getTime()) / (1000 * 60 * 60 * 24));
}

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
    .select("*, task:tasks(*), user:users(*), ng_votes(id, user_id, reason)")
    .in("task_id", ids)
    .not("notes", "eq", "__skip__")
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
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // タスク一覧を取得
  const { data: tasksRawAll } = await supabase
    .from("tasks")
    .select("id, name, space, base_point, frequency_days, weekdays, is_fixed_assign, assigned_user_id, created_at, is_free_task")
    .eq("room_id", member.room_id)
    .eq("is_active", true);
  const tasksRaw = (tasksRawAll ?? []).filter((t) => !(t as unknown as { is_free_task?: boolean }).is_free_task);

  const taskIds = (tasksRaw ?? []).map((t) => t.id);

  // ─── 並列取得: 最終完了マップ・週間履歴・担当ユーザー名 ───
  const assignedUserIds = [
    ...new Set(
      (tasksRaw ?? []).map((t) => t.assigned_user_id).filter((id): id is string => !!id)
    ),
  ];

  const [lastCompletionMap, weekCompletionsRaw, assignedUsersData] = await Promise.all([
    fetchLastCompletionMap(supabase, taskIds),  // N+1 → 1クエリ
    taskIds.length
      ? supabase
          .from("completions")
          .select("id, task_id, completed_at, task:tasks(name), user:users(name)")
          .in("task_id", taskIds)
          .gte("completed_at", monday.toISOString())
          .order("completed_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    assignedUserIds.length
      ? supabase.from("users").select("id, name").in("id", assignedUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userMap = Object.fromEntries(
    ((assignedUsersData as { data: { id: string; name: string }[] | null }).data ?? []).map((u) => [u.id, u.name])
  );

  // stale_days をメモリで計算（クエリなし）
  const tasks: ScheduleTask[] = (tasksRaw ?? []).map((task) => {
    const lastAt = lastCompletionMap[task.id] ?? null;
    const weekdays: number[] = (task as unknown as { weekdays: number[] | null }).weekdays ?? [];
    const staleDays = weekdays.length > 0
      ? calcWeekdayStaleDays(weekdays, lastAt, now, task.is_fixed_assign ? 32 : 0)
      : Math.floor((now.getTime() - new Date(lastAt ?? task.created_at).getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: task.id,
      name: task.name,
      space: task.space,
      base_point: task.base_point,
      frequency_days: task.frequency_days,
      weekdays: weekdays,
      stale_days: staleDays,
      last_completed_at: lastAt,
      created_at: task.created_at,
      is_fixed_assign: task.is_fixed_assign ?? false,
      is_mine: task.is_fixed_assign === true && task.assigned_user_id === user.id,
      assigned_user_id: task.assigned_user_id,
      assigned_user_name: task.assigned_user_id ? (userMap[task.assigned_user_id] ?? null) : null,
    };
  });

  const weekCompletions: WeekCompletion[] = ((weekCompletionsRaw as { data: unknown[] | null }).data ?? []).map(
    (c: unknown) => {
      const row = c as { id: string; task_id: string; completed_at: string; task: { name: string } | null; user: { name: string } | null };
      return {
        id: row.id,
        task_id: row.task_id,
        completed_at: row.completed_at,
        task_name: row.task?.name ?? "",
        user_name: row.user?.name ?? "",
      };
    }
  );

  return { tasks, weekCompletions };
}

export async function getMonthlyStats(year: number, month: number): Promise<Stats[]> {
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
    .select("room_id, room:rooms(bonus_multiplier_max)")
    .eq("id", user.id)
    .single();

  const bonusMax = (member?.room as unknown as { bonus_multiplier_max?: number } | null)?.bonus_multiplier_max ?? 2.0;

  if (!member?.room_id) {
    return {
      monthlyStats: [],
      tasks: [],
      recentCompletions: [],
      completionCount: 0,
      myTotalPoint: 0,
      myPenaltyCount: 0,
      myRank: 0,
      overdueCount: 0,
      memberCount: 0,
      bonusMax,
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1).toISOString();

  // ─── Step1: 並列取得（タスク一覧含む） ───
  const [
    { data: monthlyStats },
    { data: tasksRaw },
    { count: completionCount },
    { count: myPenaltyCount },
    { count: memberCount },
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
      .eq("is_active", true)
      .eq("is_free_task", false),
    supabase
      .from("completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", monthStart),
    supabase
      .from("completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_penalized", true)
      .gte("completed_at", monthStart),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("room_id", member.room_id),
  ]);

  const nonFreeTasks = (tasksRaw ?? []).filter((t) => !(t as unknown as { is_free_task?: boolean }).is_free_task);
  const taskIds = nonFreeTasks.map((t) => t.id);

  // ─── Step2: 並列取得（最終完了マップ・最近の完了・今月の完了） ───
  const [lastCompletionMap, recentCompletionsData, monthlyCompletionsData] = await Promise.all([
    fetchLastCompletionMap(supabase, taskIds),  // N+1 → 1クエリ
    taskIds.length
      ? supabase
          .from("completions")
          .select("*, task:tasks(*), user:users(*), ng_votes(id, user_id, reason)")
          .in("task_id", taskIds)
          .order("completed_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    taskIds.length
      ? supabase
          .from("completions")
          .select("user_id")
          .in("task_id", taskIds)
          .gte("completed_at", monthStart)
      : Promise.resolve({ data: [] }),
  ]);

  // stale_days をメモリで計算（クエリなし）
  const tasks = nonFreeTasks.map((task) => {
    const lastAt = lastCompletionMap[task.id] ?? null;
    const weekdays: number[] = (task as unknown as { weekdays: number[] | null }).weekdays ?? [];
    const staleDays = weekdays.length > 0
      ? calcWeekdayStaleDays(weekdays, lastAt, now, (task as unknown as { is_fixed_assign: boolean }).is_fixed_assign ? 32 : 0)
      : Math.floor((now.getTime() - new Date(lastAt ?? task.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return { ...task, last_completed_at: lastAt, stale_days: staleDays };
  });

  tasks.sort((a, b) => b.stale_days - a.stale_days);

  const overdueCount = tasks.filter((t) => t.stale_days >= t.frequency_days * 2).length;

  // user_id ごとに完了数カウント
  const taskCountByUser: Record<string, number> = {};
  for (const c of (monthlyCompletionsData as { data: { user_id: string }[] | null }).data ?? []) {
    taskCountByUser[c.user_id] = (taskCountByUser[c.user_id] ?? 0) + 1;
  }

  const statsWithCount = (monthlyStats ?? []).map((s) => ({
    ...s,
    task_count: taskCountByUser[s.user_id] ?? 0,
  }));

  const myStatIndex = statsWithCount.findIndex((s) => s.user_id === user.id);
  const myTotalPoint = myStatIndex >= 0 ? statsWithCount[myStatIndex].net_point : 0;
  const myRank = myStatIndex >= 0 ? myStatIndex + 1 : 0;

  const allRecentCompletions = (recentCompletionsData as { data: CompletionWithRelations[] | null }).data ?? [];
  const recentCompletions = allRecentCompletions.filter((c) => c.notes !== "__skip__");

  return {
    monthlyStats: statsWithCount as Stats[],
    tasks,
    recentCompletions,
    completionCount: completionCount ?? 0,
    myTotalPoint,
    myPenaltyCount: myPenaltyCount ?? 0,
    myRank,
    overdueCount,
    memberCount: memberCount ?? 1,
    bonusMax,
  };
}

export type MonthlyHistoryData = {
  ranking: Stats[];
  trend: {
    months: { year: number; month: number; label: string }[];
    series: { userId: string; name: string; data: (number | null)[] }[];
  };
  isCurrentMonth: boolean;
  year: number;
  month: number;
};

export async function getMonthlyHistory(year: number, month: number): Promise<MonthlyHistoryData> {
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

  const roomId = member.room_id;
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  // 表示月を末尾とした過去6ヶ月のウィンドウ
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) { m += 12; y--; }
    months.push({ year: y, month: m, label: `${y}/${m}` });
  }

  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 1).toISOString();

  const [
    { data: allMembers },
    { data: taskRows },
    { data: monthStatsRaw },
    { data: trendStatsRaw },
  ] = await Promise.all([
    supabase.from("users").select("id, name, avatar_url, room_id, line_user_id, created_at").eq("room_id", roomId),
    supabase.from("tasks").select("id").eq("room_id", roomId),
    supabase
      .from("monthly_stats")
      .select("*")
      .eq("room_id", roomId)
      .eq("year", year)
      .eq("month", month),
    supabase
      .from("monthly_stats")
      .select("user_id, year, month, net_point")
      .eq("room_id", roomId),
  ]);

  const members = (allMembers ?? []) as User[];
  const taskIds = (taskRows ?? []).map((t) => t.id);

  // ランキング計算：monthly_stats があればそれを使用、なければ (当月の場合) completions から集計
  let ranking: Stats[];
  let livePointMap: Record<string, number> = {};

  if (monthStatsRaw && monthStatsRaw.length > 0) {
    const taskCountByUser: Record<string, number> = {};
    if (taskIds.length) {
      const { data: completions } = await supabase
        .from("completions")
        .select("user_id")
        .in("task_id", taskIds)
        .gte("completed_at", monthStart)
        .lt("completed_at", monthEnd);
      for (const c of completions ?? []) {
        taskCountByUser[c.user_id] = (taskCountByUser[c.user_id] ?? 0) + 1;
      }
    }
    const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
    ranking = (monthStatsRaw as Stats[])
      .map((s) => ({
        ...s,
        user: memberMap[s.user_id] as User,
        task_count: taskCountByUser[s.user_id] ?? 0,
      }))
      .filter((s) => s.user)
      .sort((a, b) => b.net_point - a.net_point);
  } else if (isCurrentMonth && taskIds.length) {
    const { data: completions } = await supabase
      .from("completions")
      .select("user_id, final_point")
      .in("task_id", taskIds)
      .gte("completed_at", monthStart);

    const userAcc: Record<string, { total: number; count: number }> = {};
    for (const c of completions ?? []) {
      if (!userAcc[c.user_id]) userAcc[c.user_id] = { total: 0, count: 0 };
      userAcc[c.user_id].total += c.final_point ?? 0;
      userAcc[c.user_id].count += 1;
    }
    livePointMap = Object.fromEntries(
      Object.entries(userAcc).map(([uid, v]) => [uid, v.total])
    );
    ranking = members
      .filter((m) => userAcc[m.id])
      .map((m) => ({
        id: `live-${m.id}`,
        room_id: roomId,
        user_id: m.id,
        year,
        month,
        total_point: userAcc[m.id].total,
        penalty_pt: 0,
        net_point: userAcc[m.id].total,
        user: m,
        task_count: userAcc[m.id].count,
      }))
      .sort((a, b) => b.net_point - a.net_point);
  } else {
    ranking = [];
  }

  // トレンド: monthly_stats から対象6ヶ月を抽出
  const monthSet = new Set(months.map((m) => `${m.year}-${m.month}`));
  const trendStats = (trendStatsRaw ?? []).filter((s) =>
    monthSet.has(`${s.year}-${s.month}`)
  );

  const trendMap: Record<string, Record<string, number>> = {};
  for (const stat of trendStats) {
    if (!trendMap[stat.user_id]) trendMap[stat.user_id] = {};
    trendMap[stat.user_id][`${stat.year}-${stat.month}`] = stat.net_point;
  }
  // 当月の暫定値をトレンドにも反映
  if (isCurrentMonth) {
    for (const [uid, pt] of Object.entries(livePointMap)) {
      if (!trendMap[uid]) trendMap[uid] = {};
      trendMap[uid][`${year}-${month}`] = pt;
    }
  }

  const series = members
    .filter((m) => Object.keys(trendMap[m.id] ?? {}).length > 0)
    .map((m) => ({
      userId: m.id,
      name: m.name,
      data: months.map(({ year: y, month: mo }) => trendMap[m.id]?.[`${y}-${mo}`] ?? null),
    }));

  return { ranking, trend: { months, series }, isCurrentMonth, year, month };
}

export type DailyTrendData = {
  days: string[];
  series: { userId: string; name: string; data: (number | null)[] }[];
};

export async function getDailyPointTrend(year: number, month: number): Promise<DailyTrendData> {
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

  const roomId = member.room_id;
  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 1).toISOString();

  const [{ data: allMembers }, { data: taskRows }] = await Promise.all([
    supabase.from("users").select("id, name").eq("room_id", roomId),
    supabase.from("tasks").select("id").eq("room_id", roomId),
  ]);

  const taskIds = (taskRows ?? []).map((t) => t.id);
  if (!taskIds.length) return { days: [], series: [] };

  const { data: completions } = await supabase
    .from("completions")
    .select("user_id, final_point, completed_at")
    .in("task_id", taskIds)
    .gte("completed_at", monthStart)
    .lt("completed_at", monthEnd);

  const lastDay = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = isCurrentMonth ? now.getDate() : lastDay;

  const days: string[] = Array.from({ length: lastDay }, (_, i) => String(i + 1));

  // user_id × day の日次ポイント集計
  const dailyPoints: Record<string, Record<number, number>> = {};
  for (const c of completions ?? []) {
    const day = new Date(c.completed_at).getDate();
    if (!dailyPoints[c.user_id]) dailyPoints[c.user_id] = {};
    dailyPoints[c.user_id][day] = (dailyPoints[c.user_id][day] ?? 0) + (c.final_point ?? 0);
  }

  // 累計ポイントに変換（データを持つメンバーのみ、今日より先は null）
  const series = (allMembers ?? [])
    .filter((m) => dailyPoints[m.id])
    .map((m) => {
      let cumulative = 0;
      return {
        userId: m.id,
        name: m.name,
        data: days.map((_, i) => {
          const day = i + 1;
          if (day > todayDay) return null;
          cumulative += dailyPoints[m.id]?.[day] ?? 0;
          return cumulative;
        }),
      };
    });

  return { days, series };
}
