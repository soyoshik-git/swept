"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardData, Stats } from "@/types/database";

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
  if (!member?.room_id) throw new Error("Room not found");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 今月のポイント集計
  const { data: monthlyStats } = await supabase
    .from("monthly_stats")
    .select("*, user:users(*)")
    .eq("room_id", member.room_id)
    .eq("year", year)
    .eq("month", month)
    .order("net_point", { ascending: false });

  // アクティブなタスク一覧（放置日数を計算）
  const { data: tasksRaw } = await supabase
    .from("tasks")
    .select("*")
    .eq("room_id", member.room_id)
    .eq("is_active", true);

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
            (now.getTime() -
              new Date(lastCompletion.completed_at).getTime()) /
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

  // 放置日数順にソート
  tasks.sort((a, b) => b.stale_days - a.stale_days);

  // 直近5件の完了ログ
  const { data: recentCompletions } = await supabase
    .from("completions")
    .select("*, task:tasks(*), user:users(*)")
    .in(
      "task_id",
      (tasksRaw ?? []).map((t) => t.id),
    )
    .order("completed_at", { ascending: false })
    .limit(5);

  return {
    monthlyStats: (monthlyStats ?? []) as Stats[],
    tasks,
    recentCompletions: recentCompletions ?? [],
  };
}
