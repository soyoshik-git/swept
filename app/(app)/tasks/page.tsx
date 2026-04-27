import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
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

  // 固定担当タスクは自分のものだけ表示
  const visibleTasks = (tasks ?? []).filter(
    (t) => !t.is_fixed_assign || t.assigned_user_id === user!.id
  );

  const tasksWithStale = visibleTasks
    .map((task) => {
      const lastAt = lastCompletionMap[task.id] ?? null;
      const weekdays = (task.weekdays as number[] | null) ?? [];
      let staleDays: number;
      if (weekdays.length > 0) {
        // 曜日タスク：前回の指定曜日からの経過日数
        let lastScheduledDate: Date | null = null;
        for (let i = 0; i < 7; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          if (weekdays.includes(d.getDay())) { lastScheduledDate = d; break; }
        }
        if (!lastScheduledDate) {
          staleDays = 0;
        } else if (lastAt && new Date(lastAt) >= lastScheduledDate) {
          staleDays = 0;
        } else {
          staleDays = Math.floor((now.getTime() - lastScheduledDate.getTime()) / 86400000);
        }
      } else {
        staleDays = Math.floor((now.getTime() - new Date(lastAt ?? task.created_at).getTime()) / 86400000);
      }
      return { ...task, stale_days: staleDays };
    })
    .sort((a, b) => b.stale_days - a.stale_days);

  // 場所でグループ化（スペースなしは「その他」へ）
  const OTHER_KEY = "__other__";
  const grouped = new Map<string, typeof tasksWithStale>();
  for (const task of tasksWithStale) {
    const key = task.space?.trim() || OTHER_KEY;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(task);
  }

  // 場所グループを並び替え（その他は末尾）
  const spaceOrder = [...grouped.keys()].sort((a, b) => {
    if (a === OTHER_KEY) return 1;
    if (b === OTHER_KEY) return -1;
    return a.localeCompare(b, "ja");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">タスク管理</h1>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          ＋ 追加
        </Link>
      </div>

      {tasksWithStale.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          タスクがありません。追加してください。
        </p>
      ) : (
        <div className="space-y-4">
          {spaceOrder.map((spaceKey) => {
            const group = grouped.get(spaceKey)!;
            const label = spaceKey === OTHER_KEY ? "その他" : spaceKey;
            return (
              <div key={spaceKey} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* セクションヘッダー */}
                <div className="px-4 py-2 bg-muted/50 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {group.map((task) => {
                    const variant = getStaleBadgeVariant(task.stale_days, task.frequency_days);
                    const weekdays = (task.weekdays as number[] | null) ?? [];
                    return (
                      <li key={task.id} className="flex items-center">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors min-w-0"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">
                                {task.name}
                              </p>
                              {task.memo && (
                                <TaskMemoButton memo={task.memo} taskName={task.name} />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {task.base_point}pt ·{" "}
                              {weekdays.length
                                ? `${formatWeekdays(weekdays)}曜日`
                                : `${task.frequency_days}日ごと`}
                              {task.is_fixed_assign && " · 自分の担当"}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
