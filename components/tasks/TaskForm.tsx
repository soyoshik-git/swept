"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { displayPt, cn } from "@/lib/utils";
import type { CreateTaskInput, Task } from "@/types/database";

type Member = { id: string; name: string };

type Props = {
  initialValues?: Partial<Task>;
  members?: Member[];
  existingSpaces?: string[];
  onSubmit: (data: CreateTaskInput) => Promise<unknown>;
  submitLabel?: string;
};

const DEFAULT_SPACES = ["リビング", "キッチン", "トイレ", "バスルーム", "洗面所", "玄関", "廊下", "ベランダ"];

// 難易度5段階（DB保存値: 10/20/40/60/80）
const DIFFICULTY_LEVELS = [
  { value: 10, label: "楽",      emoji: "😊" },
  { value: 20, label: "普通",    emoji: "🙂" },
  { value: 40, label: "やや大変", emoji: "😤" },
  { value: 60, label: "大変",    emoji: "😰" },
  { value: 80, label: "激ムズ",  emoji: "🔥" },
] as const;

// 場所コンボボックス
function SpaceSelect({
  value,
  onChange,
  existingSpaces,
}: {
  value: string;
  onChange: (v: string) => void;
  existingSpaces: string[];
}) {
  const allSpaces = Array.from(new Set([...DEFAULT_SPACES, ...existingSpaces]));
  const [customSpaces, setCustomSpaces] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newSpaceInput, setNewSpaceInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const options = Array.from(new Set([...allSpaces, ...customSpaces]));

  function handleAdd() {
    const trimmed = newSpaceInput.trim();
    if (trimmed && !options.includes(trimmed)) {
      setCustomSpaces((prev) => [...prev, trimmed]);
      onChange(trimmed);
    } else if (trimmed) {
      onChange(trimmed);
    }
    setNewSpaceInput("");
    setAdding(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
    if (e.key === "Escape") { setAdding(false); setNewSpaceInput(""); }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={options.includes(value) ? value : value ? "__custom__" : ""}
          onChange={(e) => {
            if (e.target.value === "__add__") {
              setAdding(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            } else {
              onChange(e.target.value);
            }
          }}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">場所を選択（任意）</option>
          {options.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="__add__">＋ 新しい場所を追加</option>
        </select>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2 rounded-lg border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={newSpaceInput}
            onChange={(e) => setNewSpaceInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例: 寝室"
            className="flex-1 rounded-lg border border-blue-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
          >
            <Plus className="w-3.5 h-3.5" />
            追加
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewSpaceInput(""); }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-500 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskForm({
  initialValues,
  members = [],
  existingSpaces = [],
  onSubmit,
  submitLabel = "保存",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState(initialValues?.name ?? "");
  const [space, setSpace] = useState(initialValues?.space ?? "");
  const [basePoint, setBasePoint] = useState(initialValues?.base_point ?? 20);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* タスク名 */}
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

      {/* 場所 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          場所
        </label>
        <SpaceSelect
          value={space}
          onChange={setSpace}
          existingSpaces={existingSpaces}
        />
      </div>

      {/* 難易度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          難易度
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {DIFFICULTY_LEVELS.map((level) => {
            const selected = basePoint === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setBasePoint(level.value)}
                className={cn(
                  "flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-all text-center gap-1",
                  selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <span className="text-base leading-none">{level.emoji}</span>
                <span className={cn(
                  "text-[10px] font-medium leading-tight",
                  selected ? "text-blue-700" : "text-gray-500"
                )}>
                  {level.label}
                </span>
                <span className={cn(
                  "text-xs font-bold",
                  selected ? "text-blue-600" : "text-gray-400"
                )}>
                  {displayPt(level.value)}pt
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 推奨頻度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isFixedAssign ? "期限（日）" : "推奨頻度（日）"}
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
          <div className="space-y-2">
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
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
              ⚠️ 期限（{frequencyDays}日）以内に完了しないと、担当者に -{displayPt(basePoint)}pt のペナルティが発生します
            </p>
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
