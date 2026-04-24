"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Flame, Sparkles, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { completeTask } from "@/actions/completions";

type NeglectedTask = {
  id: string;
  name: string;
  space: string | null;
  stale_days: number;
  frequency_days: number;
  base_point: number;
};

function getBonusLevel(staleDays: number, frequencyDays: number) {
  const ratio = staleDays / frequencyDays;
  if (ratio >= 2) return { label: "激熱", color: "bg-red-500 text-white", icon: Flame };
  if (ratio >= 1.5) return { label: "高ボーナス", color: "bg-orange-500 text-white", icon: Sparkles };
  return { label: "ボーナス", color: "bg-amber-400 text-amber-900", icon: Sparkles };
}

function calcBonusPoints(staleDays: number, basePoint: number): number {
  return Math.floor(Math.min(staleDays * 2, basePoint * 2));
}

export function NeglectedTasks({ tasks: initialTasks }: { tasks: NeglectedTask[] }) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [confirmTask, setConfirmTask] = useState<NeglectedTask | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTasks = initialTasks.filter((t) => !completedIds.has(t.id));

  function handleConfirm() {
    if (!confirmTask) return;
    const taskId = confirmTask.id;
    startTransition(async () => {
      await completeTask(taskId);
      setCompletedIds((prev) => new Set([...prev, taskId]));
      setConfirmTask(null);
    });
  }

  if (activeTasks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />放置タスク
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">放置タスクはありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />放置タスク
            </CardTitle>
            <span className="text-xs text-muted-foreground">{activeTasks.length}件</span>
          </div>
          <p className="text-xs text-muted-foreground">長く放置されたタスクほどボーナスポイントがアップ</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {activeTasks.map((task) => {
            const bonus = getBonusLevel(task.stale_days, task.frequency_days);
            const BonusIcon = bonus.icon;
            const bonusPoints = calcBonusPoints(task.stale_days, task.base_point);
            const totalPoints = task.base_point + bonusPoints;

            return (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{task.name}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${bonus.color}`}>
                      <BonusIcon className="h-3 w-3" />{bonus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.space && <span>{task.space}</span>}
                    {task.space && <span>・</span>}
                    <span>{task.stale_days}日放置</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-right">
                    <span className="text-base font-bold text-primary">+{totalPoints}</span>
                    <span className="text-[10px] text-muted-foreground ml-0.5">pt</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => setConfirmTask(task)}
                    disabled={isPending}
                  >
                    <Check className="h-3 w-3 mr-1" />やる
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 確認モーダル */}
      {confirmTask && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => !isPending && setConfirmTask(null)} />
          <div className="relative rounded-t-2xl bg-white px-4 pt-5 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="text-center text-sm text-muted-foreground mb-1">掃除を完了しましたか？</p>
            <p className="text-center font-bold text-foreground text-base mb-0.5">{confirmTask.name}</p>
            {confirmTask.space && (
              <p className="text-center text-xs text-muted-foreground mb-3">{confirmTask.space}</p>
            )}
            <p className="text-center text-lg font-bold text-primary mb-5">
              +{confirmTask.base_point + calcBonusPoints(confirmTask.stale_days, confirmTask.base_point)}pt
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTask(null)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "完了中..." : "完了にする"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
