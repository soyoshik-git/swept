"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check } from "lucide-react";
import { completeFreeTask } from "@/actions/completions";

const POINTS = [10, 20, 30, 40] as const;

type Props = {
  onClose: () => void;
};

export function FreeTaskModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [point, setPoint] = useState<10 | 20 | 30 | 40>(10);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name.trim()) { setError("タスク名を入力してください"); return; }
    setError(null);
    startTransition(async () => {
      try {
        await completeFreeTask({ name, notes: notes || null, point });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-background rounded-t-2xl shadow-xl px-5 pt-5 pb-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground">フリータスク完了</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* タスク名 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">タスク名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 換気扇掃除"
            maxLength={50}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* メモ */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">メモ（任意）</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="補足メモがあれば"
            maxLength={200}
            rows={2}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* ポイントスライダー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">ポイント</label>
            <span className="text-sm font-bold text-primary">{point}pt</span>
          </div>
          <input
            type="range"
            min={10}
            max={40}
            step={10}
            value={point}
            onChange={(e) => setPoint(Number(e.target.value) as 10 | 20 | 30 | 40)}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
            {POINTS.map((p) => <span key={p}>{p}pt</span>)}
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* ボタン */}
        <button
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {isPending ? "記録中…" : "完了にする"}
        </button>
      </div>
    </div>
  );
}
