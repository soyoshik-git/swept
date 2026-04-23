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
  if (ratio >= 2) {
    return { label: "激熱", color: "bg-red-500 text-white", icon: Flame };
  } else if (ratio >= 1.5) {
    return { label: "高ボーナス", color: "bg-orange-500 text-white", icon: Sparkles };
  } else {
    return { label: "ボーナス", color: "bg-amber-400 text-amber-900", icon: Sparkles };
  }
}

function calcBonusPoints(staleDays: number, basePoint: number): number {
  // ボーナスポイント: 放置日数に応じて増加（最大ベースの2倍まで）
  const bonus = Math.min(staleDays * 2, basePoint * 2);
  return Math.floor(bonus);
}

type Props = {
  tasks: NeglectedTask[];
};

export function NeglectedTasks({ tasks: initialTasks }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const activeTasks = initialTasks.filter((t) => !completedIds.has(t.id));

  function handleComplete(taskId: string) {
    setCompletingId(taskId);
    startTransition(async () => {
      await completeTask(taskId);
      setCompletedIds((prev) => new Set([...prev, taskId]));
      setCompletingId(null);
    });
  }

  if (activeTasks.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            放置タスク
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            放置タスクはありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            放置タスク
          </CardTitle>
          <span className="text-xs text-muted-foreground">{activeTasks.length}件</span>
        </div>
        <p className="text-xs text-muted-foreground">
          長く放置されたタスクほどボーナスポイントがアップ
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {activeTasks.map((task) => {
          const bonus = getBonusLevel(task.stale_days, task.frequency_days);
          const BonusIcon = bonus.icon;
          const bonusPoints = calcBonusPoints(task.stale_days, task.base_point);
          const totalPoints = task.base_point + bonusPoints;
          const isCompleting = isPending && completingId === task.id;

          return (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{task.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${bonus.color}`}
                  >
                    <BonusIcon className="h-3 w-3" />
                    {bonus.label}
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
                  onClick={() => handleComplete(task.id)}
                  disabled={isPending}
                >
                  {isCompleting ? (
                    <svg className="h-3 w-3 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  やる
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
