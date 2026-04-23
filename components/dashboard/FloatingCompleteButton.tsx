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
};

export function FloatingCompleteButton({ tasks }: { tasks: Task[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [completingId, setCompletingId] = useState<string | null>(null);

  // 設定ページでは非表示
  if (pathname.startsWith("/settings")) return null;

  function handleComplete(taskId: string) {
    setCompletingId(taskId);
    startTransition(async () => {
      await completeTask(taskId);
      setOpen(false);
      setCompletingId(null);
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

      {/* ボトムシート */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative rounded-t-2xl bg-white max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">完了するタスクを選択</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <ul className="overflow-y-auto divide-y divide-gray-100">
              {tasks.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-gray-400">
                  アクティブなタスクがありません
                </li>
              )}
              {tasks.map((task) => {
                const variant = getStaleBadgeVariant(
                  task.stale_days,
                  task.frequency_days,
                );
                const isCompleting = isPending && completingId === task.id;
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={isPending}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {task.name}
                        </p>
                        {task.space && (
                          <p className="text-xs text-gray-400">{task.space}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={variant}>
                          {formatStaleDays(task.stale_days)}
                        </Badge>
                        {isCompleting && (
                          <svg
                            className="h-4 w-4 animate-spin text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
