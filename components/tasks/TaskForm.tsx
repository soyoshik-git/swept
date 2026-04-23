"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { CreateTaskInput, Task } from "@/types/database";

type Member = { id: string; name: string };

type Props = {
  initialValues?: Partial<Task>;
  members?: Member[];
  onSubmit: (data: CreateTaskInput) => Promise<unknown>;
  submitLabel?: string;
};

export function TaskForm({
  initialValues,
  members = [],
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
  const [assignedUserId, setAssignedUserId] = useState(
    initialValues?.assigned_user_id ?? "",
  );

  function handleFixedAssignChange(checked: boolean) {
    setIsFixedAssign(checked);
    if (!checked) setAssignedUserId("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isFixedAssign && !assignedUserId) {
      setError("固定担当タスクの場合、担当者を選択してください");
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit({
          name,
          space: space || undefined,
          base_point: basePoint,
          frequency_days: frequencyDays,
          is_fixed_assign: isFixedAssign,
          assigned_user_id: isFixedAssign ? assignedUserId : undefined,
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

      {/* 固定担当 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFixedAssign}
            onChange={(e) => handleFixedAssignChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">固定担当タスク</span>
        </label>

        {isFixedAssign && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              担当者 <span className="text-red-500">*</span>
            </label>
            {members.length === 0 ? (
              <p className="text-xs text-gray-400">メンバーが見つかりません</p>
            ) : (
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">担当者を選択してください</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

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
