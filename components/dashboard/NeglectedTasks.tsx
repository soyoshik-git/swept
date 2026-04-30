"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Flame, Sparkles, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { completeTask } from "@/actions/completions";
import { overlay, slideUp, sheetSpring, softSpring, fastFade, staggerContainer, fadeUp, spring } from "@/lib/animate";
import { displayPt } from "@/lib/utils";

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

  if (activeTasks.length === 0) return null;

  return (
    <>
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-2 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <p className="font-heading text-base font-bold text-foreground leading-tight">Neglected</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">放置タスク</p>
              </div>
            </CardTitle>
            <span className="text-xs text-muted-foreground">{activeTasks.length}件</span>
          </div>
          <p className="text-xs text-muted-foreground">長く放置されたタスクほどボーナスポイントがアップ</p>
        </CardHeader>
        <CardContent className="px-4">
          <motion.div
            className="flex flex-col gap-2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {activeTasks.map((task, index) => {
                const bonus = getBonusLevel(task.stale_days, task.frequency_days);
                const BonusIcon = bonus.icon;
                const bonusPoints = calcBonusPoints(task.stale_days, task.base_point);
                const totalPoints = task.base_point + bonusPoints;

                return (
                  <motion.div
                    key={task.id}
                    variants={fadeUp}
                    transition={{ ...spring, delay: index * 0.05 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.25 } }}
                    layout
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{task.name}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${bonus.color}`}>
                          <BonusIcon className="h-3 w-3" />{bonus.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.space && <span>{task.space}</span>}
                        {task.space && <span>·</span>}
                        <span>{task.stale_days}日放置</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-bold text-primary">+{displayPt(totalPoints)}</span>
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>

      {/* 確認モーダル */}
      <AnimatePresence>
        {confirmTask && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-black/40"
              variants={overlay}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={fastFade}
              onClick={() => !isPending && setConfirmTask(null)}
            />
            <motion.div
              className="relative rounded-t-2xl bg-white px-4 pt-3 pb-10"
              variants={slideUp}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={sheetSpring}
            >
              <div className="flex justify-center mb-5">
                <div className="w-9 h-1 bg-gray-200 rounded-full" />
              </div>

              <motion.div
                className="flex justify-center mb-3"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 24, delay: 0.1 }}
              >
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-2xl">
                  🔥
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...softSpring }}
              >
                <p className="text-center text-sm text-muted-foreground mb-1">掃除を完了しましたか？</p>
                <p className="text-center font-bold text-foreground text-base mb-0.5">{confirmTask.name}</p>
                {confirmTask.space && (
                  <p className="text-center text-xs text-muted-foreground mb-3">{confirmTask.space}</p>
                )}
                <motion.p
                  className="text-center text-2xl font-bold text-primary mb-6"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.22 }}
                >
                  +{displayPt(confirmTask.base_point + calcBonusPoints(confirmTask.stale_days, confirmTask.base_point))}pt
                </motion.p>
              </motion.div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTask(null)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                >
                  キャンセル
                </button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity"
                  whileTap={{ scale: 0.97 }}
                >
                  {isPending ? "完了中..." : "完了にする"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
