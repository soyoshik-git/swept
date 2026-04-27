import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeaderCompat as CardHeader } from "@/components/ui/Card";
import { getStaleBadgeVariant, formatStaleDays, formatWeekdays } from "@/lib/utils";
import { TaskMemoButton } from "@/components/tasks/TaskMemoButton";

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

  const taskIds = (tasks ?? []).map((t) => t.id);

  // 最終完了日を一括取得（N+1解消）
  const { data: allCompletions } = taskIds.length
    ? await supabase
        .from("completions")
        .select("task_id, completed_at")
        .in("task_id", taskIds)
        .order("completed_at", { ascending: false })
    : { data: [] };

  const lastCompletionMap: Record<string, string> = {};
  for (const c of allCompletions ?? []) {
    if (!lastCompletionMap[c.task_id]) lastCompletionMap[c.task_id] = c.completed_at;
  }

  const now = new Date();
  const tasksWithStale = (tasks ?? [])
    .map((task) => {
      const lastAt = lastCompletionMap[task.id] ?? null;
      const baseDateMs = new Date(lastAt ?? task.created_at).getTime();
      const staleDays = Math.floor((now.getTime() - baseDateMs) / 86400000);
      return { ...task, stale_days: staleDays };
    })
    .sort((a, b) => b.stale_days - a.stale_days);

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
              const variant = getStaleBadgeVariant(task.stale_days, task.frequency_days);
              return (
                <li key={task.id} className="flex items-center">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors min-w-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.name}
                        </p>
                        {task.memo && (
                          <TaskMemoButton memo={task.memo} taskName={task.name} />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {task.space && `${task.space} · `}
                        {task.base_point}pt ·{" "}
                        {(task.weekdays as number[] | null)?.length
                          ? `${formatWeekdays(task.weekdays as number[])}曜日`
                          : `${task.frequency_days}日ごと`}
                        {task.is_fixed_assign && " · 固定担当"}
                      </p>
                    </div>
                    <Badge variant={variant} className="shrink-0 ml-2">
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
