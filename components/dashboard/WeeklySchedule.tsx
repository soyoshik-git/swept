"use client";

import { useState, useTransition, useMemo } from "react";
import { Check, Bath, UtensilsCrossed, Shirt, Leaf, Trash2, Sparkles, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { completeTask } from "@/actions/completions";
import type { ScheduleTask, WeekCompletion } from "@/actions/stats";

type Props = {
  tasks: ScheduleTask[];
  weekCompletions: WeekCompletion[];
};

type TaskWithDueDate = ScheduleTask & { due_date: string };

const DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"];

const AVATAR_COLORS = [
  "bg-primary", "bg-accent", "bg-chart-5", "bg-chart-4", "bg-chart-1", "bg-chart-2",
];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getTaskStyle(name: string, space: string | null): { Icon: React.ElementType; colorClass: string } {
  const text = `${name} ${space ?? ""}`.toLowerCase();
  if (/キッチン|台所|調理|料理/.test(text)) return { Icon: UtensilsCrossed, colorClass: "bg-orange-100 text-orange-600" };
  if (/浴室|風呂|バス|お風呂/.test(text)) return { Icon: Bath, colorClass: "bg-blue-100 text-blue-600" };
  if (/ゴミ|ごみ/.test(text)) return { Icon: Trash2, colorClass: "bg-gray-100 text-gray-600" };
  if (/洗濯/.test(text)) return { Icon: Shirt, colorClass: "bg-pink-100 text-pink-600" };
  if (/庭|草|植物/.test(text)) return { Icon: Leaf, colorClass: "bg-green-100 text-green-600" };
  if (/トイレ|洗面|排水/.test(text)) return { Icon: Droplets, colorClass: "bg-cyan-100 text-cyan-600" };
  return { Icon: Sparkles, colorClass: "bg-purple-100 text-purple-600" };
}

/** ローカルタイムゾーンで YYYY-MM-DD を返す */
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ローカルタイムゾーンで次の期限日を計算 */
function calcDueDate(lastCompletedAt: string | null, createdAt: string, frequencyDays: number): string {
  const base = new Date(lastCompletedAt ?? createdAt);
  const due = new Date(base);
  due.setDate(due.getDate() + frequencyDays);
  return localDateStr(due);
}

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function WeeklySchedule({ tasks, weekCompletions }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);

  const weekDates = useMemo(() => getWeekDates(), []);

  const todayIdx = useMemo(() => {
    return weekDates.findIndex((d) => localDateStr(d) === todayStr);
  }, [weekDates, todayStr]);

  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [localCompletedIds, setLocalCompletedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<TaskWithDueDate | null>(null);

  const selectedDate = weekDates[selectedIdx];
  const selectedStr = localDateStr(selectedDate);
  const isToday = selectedStr === todayStr;
  const isFuture = selectedDate > today;

  // ローカルタイムゾーンでdue_dateを付与したタスク一覧
  const tasksWithDueDate = useMemo(() =>
    tasks.map((t) => ({
      ...t,
      due_date: calcDueDate(t.last_completed_at, t.created_at, t.frequency_days),
    })),
    [tasks]
  );

  // 今日DBで完了済みのtask_idセット（前のセッションでの完了を含む）
  const dbCompletedTodayIds = useMemo(() => {
    return new Set(
      weekCompletions
        .filter((c) => localDateStr(new Date(c.completed_at)) === todayStr)
        .map((c) => c.task_id)
    );
  }, [weekCompletions, todayStr]);

  // 全完了済みIDs（DB + ローカル）
  const allCompletedIds = useMemo(() => {
    return new Set([...dbCompletedTodayIds, ...localCompletedIds]);
  }, [dbCompletedTodayIds, localCompletedIds]);

  // 選択日に表示するタスクを計算
  const { pendingTasks, completedTasksForDay } = useMemo(() => {
    if (isToday) {
      // 今日：期限日が今日以前のタスク
      const dueTasks = tasksWithDueDate.filter((t) => t.due_date <= todayStr);
      return {
        pendingTasks: dueTasks
          .filter((t) => !allCompletedIds.has(t.id))
          .sort((a, b) => {
            if (a.is_mine !== b.is_mine) return a.is_mine ? -1 : 1;
            return b.stale_days - a.stale_days;
          }),
        completedTasksForDay: dueTasks.filter((t) => allCompletedIds.has(t.id)),
      };
    }
    if (isFuture) {
      // 未来：その日が期限のタスク
      return {
        pendingTasks: tasksWithDueDate
          .filter((t) => t.due_date === selectedStr && !allCompletedIds.has(t.id))
          .sort((a, b) => {
            if (a.is_mine !== b.is_mine) return a.is_mine ? -1 : 1;
            return 0;
          }),
        completedTasksForDay: [],
      };
    }
    return { pendingTasks: [], completedTasksForDay: [] };
  }, [tasksWithDueDate, isToday, isFuture, todayStr, selectedStr, allCompletedIds]);

  // 過去の日の完了履歴（ローカル日付で比較）
  const dayCompletions = useMemo(() =>
    weekCompletions.filter(
      (c) => localDateStr(new Date(c.completed_at)) === selectedStr
    ),
    [weekCompletions, selectedStr]
  );

  // ドット計算（タスクリストと完全に一致させる）
  function getDayDots(dateStr: string, dayIdx: number) {
    if (dayIdx === todayIdx) {
      const dueTasks = tasksWithDueDate.filter((t) => t.due_date <= todayStr);
      return {
        pending: dueTasks.filter((t) => !allCompletedIds.has(t.id)).length,
        done: dueTasks.filter((t) => allCompletedIds.has(t.id)).length,
      };
    }
    if (dateStr < todayStr) {
      // 過去：完了履歴の件数
      const done = weekCompletions.filter(
        (c) => localDateStr(new Date(c.completed_at)) === dateStr
      ).length;
      return { pending: 0, done };
    }
    // 未来：その日が期限のタスク
    const pending = tasksWithDueDate.filter(
      (t) => t.due_date === dateStr && !allCompletedIds.has(t.id)
    ).length;
    return { pending, done: 0 };
  }

  function handleConfirm(task: TaskWithDueDate) {
    setConfirmTask(task);
  }

  function handleComplete() {
    if (!confirmTask) return;
    const taskId = confirmTask.id;
    setConfirmTask(null);
    setCompletingId(taskId);
    startTransition(async () => {
      await completeTask(taskId);
      setLocalCompletedIds((prev) => new Set([...prev, taskId]));
      setCompletingId(null);
    });
  }

  function TaskRow({
    task,
    completed = false,
    onComplete,
    isCompleting = false,
  }: {
    task: TaskWithDueDate;
    completed?: boolean;
    onComplete?: () => void;
    isCompleting?: boolean;
  }) {
    const { Icon, colorClass } = getTaskStyle(task.name, task.space);
    return (
      <div
        onClick={onComplete && !completed && !isPending ? onComplete : undefined}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border transition-all",
          completed
            ? "bg-muted/50 border-transparent"
            : task.is_mine
            ? "bg-primary/5 border-primary/20 active:scale-[0.98] cursor-pointer"
            : "bg-card border-border active:scale-[0.98] cursor-pointer"
        )}
      >
        <div className={cn("p-2 rounded-lg shrink-0", colorClass, completed && "opacity-50")}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-medium text-foreground",
            completed && "line-through opacity-60",
            task.is_mine && !completed && "font-semibold"
          )}>
            {task.name}
            {task.is_mine && !completed && (
              <span className="ml-1.5 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                自分
              </span>
            )}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.assigned_user_id && task.assigned_user_name && !task.is_mine && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className={cn("text-[8px] text-white", getAvatarColor(task.assigned_user_id))}>
                    {task.assigned_user_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{task.assigned_user_name}さん</span>
              </div>
            )}
            {task.space && (
              <span className="text-[10px] text-muted-foreground">{task.space}</span>
            )}
            {!completed && (
              <span className="text-[10px] font-medium text-primary">+{task.base_point}pt</span>
            )}
          </div>
        </div>
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          completed ? "bg-accent border-accent"
            : isCompleting ? "border-accent bg-accent/20"
            : task.is_mine ? "border-primary/50" : "border-muted-foreground/30"
        )}>
          {completed && <Check className="w-3 h-3 text-accent-foreground" />}
          {isCompleting && <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    );
  }

  return (
    <>
    {/* 完了確認モーダル */}
    {confirmTask && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 pb-safe"
        onClick={() => setConfirmTask(null)}
      >
        <div
          className="bg-card w-full max-w-sm rounded-t-2xl p-6 space-y-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-muted rounded-full mx-auto -mt-2 mb-2" />
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-foreground">{confirmTask.name}</p>
            {confirmTask.space && (
              <p className="text-sm text-muted-foreground">{confirmTask.space}</p>
            )}
            <p className="text-2xl font-bold text-primary pt-1">+{confirmTask.base_point}pt</p>
            <p className="text-xs text-muted-foreground">完了すると上記ポイントが加算されます</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setConfirmTask(null)}
              className="h-12 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleComplete}
              className="h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
            >
              完了にする
            </button>
          </div>
        </div>
      </div>
    )}
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3 px-4">
        <CardTitle className="text-base text-foreground">今週のスケジュール</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {/* 週カレンダー */}
        <div className="flex gap-1.5 mb-4">
          {weekDates.map((date, i) => {
            const dateStr = localDateStr(date);
            const isSelected = i === selectedIdx;
            const isTodayDate = dateStr === todayStr;
            const { pending, done } = getDayDots(dateStr, i);
            const total = Math.min(pending + done, 5);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  "flex flex-col items-center flex-1 py-2 rounded-xl transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground active:bg-secondary/80"
                )}
              >
                <span className={cn(
                  "text-[10px] font-medium opacity-80",
                  !isSelected && i === 5 && "text-blue-500",
                  !isSelected && i === 6 && "text-red-500",
                )}>
                  {DAY_NAMES[i]}
                </span>
                <span className={cn("text-sm font-bold", isTodayDate && !isSelected && "text-primary")}>
                  {date.getDate()}
                </span>
                {total > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: total }).map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={cn(
                          "w-1 h-1 rounded-full",
                          dotIdx < done
                            ? isSelected ? "bg-primary-foreground" : "bg-accent"
                            : isSelected ? "bg-primary-foreground/40" : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* タスクリスト */}
        <div className="space-y-2">
          {(isToday || isFuture) ? (
            pendingTasks.length === 0 && completedTasksForDay.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                この日のタスクはありません
              </div>
            ) : (
              <>
                {pendingTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={() => handleConfirm(task)}
                    isCompleting={isPending && completingId === task.id}
                  />
                ))}
                {completedTasksForDay.map((task) => (
                  <TaskRow key={task.id} task={task} completed />
                ))}
              </>
            )
          ) : (
            dayCompletions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                この日の記録はありません
              </div>
            ) : (
              dayCompletions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border-transparent">
                  <div className="p-2 rounded-lg shrink-0 bg-accent/10 text-accent opacity-60">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground line-through opacity-60">
                      {c.task_name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {c.user_name}さん · {new Date(c.completed_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-accent border-accent border-2 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent-foreground" />
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
