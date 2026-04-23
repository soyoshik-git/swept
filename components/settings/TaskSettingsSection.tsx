"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListTodo, Sparkles, ChevronRight, Check, X } from "lucide-react";
import Link from "next/link";
import { updateRoomSettings } from "@/actions/rooms";

type Props = {
  bonusMultiplierMax: number;
};

export function TaskSettingsSection({ bonusMultiplierMax: initialMax }: Props) {
  const [multiplier, setMultiplier] = useState(initialMax);
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(initialMax);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const clamped = Math.min(3.0, Math.max(1.0, tempValue));
    startTransition(async () => {
      await updateRoomSettings({ bonus_multiplier_max: clamped });
      setMultiplier(clamped);
      setEditing(false);
    });
  };

  const handleCancel = () => {
    setTempValue(multiplier);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-primary" />
          タスク設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* 放置ボーナス倍率 */}
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border-b border-border">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">放置ボーナス上限倍率</p>
            <p className="text-xs text-muted-foreground mb-2">放置タスクに付与する最大ボーナス倍率</p>

            {editing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1.0}
                    max={3.0}
                    step={0.5}
                    value={tempValue}
                    onChange={(e) => setTempValue(parseFloat(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-bold text-primary w-10 text-right">
                    {tempValue.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                  <span>1.0x</span><span>1.5x</span><span>2.0x</span><span>2.5x</span><span>3.0x</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />保存
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 active:scale-95 transition-all"
                  >
                    <X className="w-3 h-3" />キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">{multiplier.toFixed(1)}x</span>
                <button
                  onClick={() => { setTempValue(multiplier); setEditing(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  変更
                </button>
              </div>
            )}
          </div>
        </div>

        {/* タスク管理リンク */}
        <Link
          href="/tasks"
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ListTodo className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">タスク管理</p>
            <p className="text-xs text-muted-foreground">掃除タスクの追加・編集・削除</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}
