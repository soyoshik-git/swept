"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveTask } from "@/actions/tasks";

export function ArchiveTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    startTransition(async () => {
      try {
        await archiveTask(taskId);
        router.push("/tasks");
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {isPending ? "アーカイブ中..." : "このタスクをアーカイブする"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1 text-center">{error}</p>}
    </div>
  );
}
