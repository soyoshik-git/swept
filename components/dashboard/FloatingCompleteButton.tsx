"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { completeTask } from "@/actions/completions";
import { getStaleBadgeVariant, formatStaleDays } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

type Task = {
  id: string;
  name: string;
  space: string | null;
  stale_days: number;
  frequency_days: number;
  base_point: number;
};

export function FloatingCompleteButton({ tasks }: { tasks: Task[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();

  if (pathname.startsWith("/settings")) return null;

  function handleSelect(task: Task) {
    setConfirmTask(task);
  }

  function handleConfirm() {
    if (!confirmTask) return;
    startTransition(async () => {
      await completeTask(confirmTask.id);
      setConfirmTask(null);
      setOpen(false);
    });
  }

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors text-2xl"
        aria-label="タスクを完了する"
      >
        ＋
      </button>

      {/* タスク選択シート */}
      {open && !confirmTask && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative rounded-t-2xl bg-white max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">完了するタスクを選択</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <ul className="overflow-y-auto divide-y divide-gray-100">
              {tasks.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-gray-400">アクティブなタスクがありません</li>
              )}
              {tasks.map((task) => {
                const variant = getStaleBadgeVariant(task.stale_days, task.frequency_days);
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => handleSelect(task)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{task.name}</p>
                        {task.space && <p className="text-xs text-gray-400">{task.space}</p>}
                      </div>
                      <Badge variant={variant}>{formatStaleDays(task.stale_days)}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

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
            <p className="text-center text-lg font-bold text-primary mb-5">+{confirmTask.base_point}pt</p>
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
