"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Pencil } from "lucide-react";
import { completeTask } from "@/actions/completions";
import { getStaleBadgeVariant, formatStaleDays } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { overlay, slideUp, sheetSpring, softSpring, fastFade } from "@/lib/animate";
import { displayPt } from "@/lib/utils";
import { TaskMemoButton } from "@/components/tasks/TaskMemoButton";
import { FreeTaskModal } from "@/components/tasks/FreeTaskModal";

type Task = {
  id: string;
  name: string;
  space: string | null;
  memo: string | null;
  stale_days: number;
  frequency_days: number;
  base_point: number;
};

export function FloatingCompleteButton({ tasks }: { tasks: Task[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [freeTaskOpen, setFreeTaskOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [justDone, setJustDone] = useState(false);

  if (pathname.startsWith("/settings")) return null;

  function handleConfirm() {
    if (!confirmTask) return;
    startTransition(async () => {
      await completeTask(confirmTask.id);
      setJustDone(true);
      setConfirmTask(null);
      setOpen(false);
      setTimeout(() => setJustDone(false), 800);
    });
  }

  const showSheet = open && !confirmTask;
  const showConfirm = !!confirmTask;

  const OTHER_KEY = "__other__";
  const grouped = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.space?.trim() || OTHER_KEY;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(task);
  }
  const spaceOrder = [...grouped.keys()].sort((a, b) => {
    if (a === OTHER_KEY) return 1;
    if (b === OTHER_KEY) return -1;
    return a.localeCompare(b, "ja");
  });

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-white shadow-lg shadow-violet-500/30"
        aria-label="タスクを完了する"
        whileTap={{ scale: 0.88 }}
        animate={justDone ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
        transition={justDone ? { duration: 0.5, ease: "easeOut" } : { type: "spring", stiffness: 400, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      {/* タスク選択シート */}
      <AnimatePresence>
        {showSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-black/40"
              variants={overlay}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={fastFade}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative rounded-t-2xl bg-white max-h-[70vh] flex flex-col"
              variants={slideUp}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={sheetSpring}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-9 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">完了するタスクを選択</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto">
                {tasks.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">
                    アクティブなタスクがありません
                  </p>
                )}
                {spaceOrder.map((spaceKey) => {
                  const group = grouped.get(spaceKey)!;
                  const label = spaceKey === OTHER_KEY ? "その他" : spaceKey;
                  let itemIndex = 0;
                  for (const k of spaceOrder) {
                    if (k === spaceKey) break;
                    itemIndex += grouped.get(k)!.length;
                  }
                  return (
                    <div key={spaceKey}>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {label}
                        </span>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {group.map((task, i) => {
                          const variant = getStaleBadgeVariant(task.stale_days, task.frequency_days);
                          return (
                            <motion.li
                              key={task.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (itemIndex + i) * 0.04, ...softSpring }}
                            >
                              <button
                                onClick={() => setConfirmTask(task)}
                                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                              >
                                <div className="text-left flex-1 min-w-0 flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-gray-900">{task.name}</p>
                                  {task.memo && (
                                    <TaskMemoButton memo={task.memo} taskName={task.name} />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-bold text-primary">+{displayPt(task.base_point)}pt</span>
                                  <Badge variant={variant}>{formatStaleDays(task.stale_days)}</Badge>
                                </div>
                              </button>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}

                {/* フリータスク */}
                <div>
                  <div className="px-4 py-2 bg-violet-50 border-b border-gray-100 border-t border-t-gray-100">
                    <span className="text-xs font-semibold text-violet-500 uppercase tracking-wide">フリータスク</span>
                  </div>
                  <button
                    onClick={() => { setOpen(false); setFreeTaskOpen(true); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">その他</p>
                        <p className="text-xs text-gray-400">フリータスク・10〜40pt</p>
                      </div>
                    </div>
                    <span className="text-xs text-primary font-medium border border-primary/30 rounded-full px-2.5 py-0.5 shrink-0">
                      完了する
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 確認モーダル */}
      <AnimatePresence>
        {showConfirm && confirmTask && (
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
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  🧹
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...softSpring }}
              >
                <p className="text-center text-sm text-muted-foreground mb-1">掃除を完了しましたか？</p>
                <p className="text-center font-bold text-foreground text-base mb-0.5">
                  {confirmTask.name}
                </p>
                {confirmTask.space && (
                  <p className="text-center text-xs text-muted-foreground mb-3">{confirmTask.space}</p>
                )}
                <motion.p
                  className="text-center text-2xl font-bold text-primary mb-6"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.22 }}
                >
                  +{displayPt(confirmTask.base_point)}pt
                </motion.p>
              </motion.div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTask(null)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 active:bg-muted disabled:opacity-50 transition-colors"
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

      {/* フリータスクモーダル */}
      {freeTaskOpen && (
        <FreeTaskModal onClose={() => { setFreeTaskOpen(false); setJustDone(true); setTimeout(() => setJustDone(false), 800); }} />
      )}
    </>
  );
}
