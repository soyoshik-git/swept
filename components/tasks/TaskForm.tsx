"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { CreateTaskInput, Task } from "@/types/database";

type Props = {
  initialValues?: Partial<Task>;
  onSubmit: (data: CreateTaskInput) => Promise<unknown>;
  submitLabel?: string;
};

export function TaskForm({
  initialValues,
  onSubmit,
  submitLabel = "保存",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState(initialValues?.name ?? "");
  const [space, setSpace] = useState(initialValues?.space ?? "");
  const [basePoint, setBasePoint] = useState(initialValues?.base_point ?? 10);
  const [frequencyDays, setFrequencyDays] = useState(
    initialValues?.frequency_days ?? 7,
  );
  const [isFixedAssign, setIsFixedAssign] = useState(
    initialValues?.is_fixed_assign ?? false,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await onSubmit({
          name,
          space: space || undefined,
          base_point: basePoint,
          frequency_days: frequencyDays,
          is_fixed_assign: isFixedAssign,
        });
        router.push("/tasks");
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          タスク名 <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: トイレ掃除"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          場所
        </label>
        <input
          value={space}
          onChange={(e) => setSpace(e.target.value)}
          placeholder="例: トイレ・キッチン"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            基本ポイント
          </label>
          <input
            type="number"
            min={1}
            required
            value={basePoint}
            onChange={(e) => setBasePoint(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            推奨頻度（日）
          </label>
          <input
            type="number"
            min={1}
            required
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isFixedAssign}
          onChange={(e) => setIsFixedAssign(e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">固定担当タスク</span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button type="submit" loading={isPending} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
