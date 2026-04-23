import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeaderCompat as CardHeader } from "@/components/ui/Card";
import { getStaleBadgeVariant, formatStaleDays } from "@/lib/utils";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user!.id)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("room_id", member?.room_id ?? "")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const now = new Date();
  const tasksWithStale = await Promise.all(
    (tasks ?? []).map(async (task) => {
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
              86400000,
          )
        : 999;

      return { ...task, stale_days: staleDays };
    }),
  );

  tasksWithStale.sort((a, b) => b.stale_days - a.stale_days);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">タスク管理</h1>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          ＋ 追加
        </Link>
      </div>

      <Card>
        <CardHeader title="アクティブなタスク" />
        {tasksWithStale.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            タスクがありません。追加してください。
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tasksWithStale.map((task) => {
              const variant = getStaleBadgeVariant(
                task.stale_days,
                task.frequency_days,
              );
              return (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {task.space && `${task.space} · `}
                        {task.base_point}pt · {task.frequency_days}日ごと
                        {task.is_fixed_assign && " · 固定担当"}
                      </p>
                    </div>
                    <Badge variant={variant}>
                      {formatStaleDays(task.stale_days)}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
