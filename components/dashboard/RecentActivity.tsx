"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, MoreVertical, RotateCcw, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { undoCompletion, voteNG } from "@/actions/completions";
import type { Completion, Task, User } from "@/types/database";

type CompletionWithRelations = Completion & { task: Task; user: User };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

const AVATAR_COLORS = ["bg-primary","bg-accent","bg-chart-5","bg-chart-4","bg-chart-1","bg-chart-2"];

type Props = {
  completions: CompletionWithRelations[];
  currentUserId?: string;
  showAll?: boolean;
};

function CompletionMenu({ completion, currentUserId, onDone }: {
  completion: CompletionWithRelations;
  currentUserId?: string;
  onDone: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isOwn = completion.user_id === currentUserId;

  function handleUndo() {
    setOpen(false);
    startTransition(async () => {
      try {
        await undoCompletion(completion.id);
        onDone(completion.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  }

  function handleNG() {
    setOpen(false);
    startTransition(async () => {
      try {
        await voteNG(completion.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-40"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-36 rounded-xl bg-card border border-border shadow-lg py-1 overflow-hidden">
            {isOwn ? (
              <button
                onClick={handleUndo}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                取り消す
              </button>
            ) : (
              <button
                onClick={handleNG}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                NGを出す
              </button>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="absolute right-0 top-8 z-20 text-[10px] text-destructive bg-card border border-border rounded px-2 py-1 whitespace-nowrap shadow">
          {error}
        </p>
      )}
    </div>
  );
}

export function RecentActivity({ completions: initialCompletions, currentUserId, showAll }: Props) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const completions = initialCompletions.filter((c) => !removedIds.has(c.id));

  const userColorMap = new Map<string, string>();

  if (completions.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground">アクティビティ</CardTitle>
            <Link href="/activity" className="text-xs text-primary font-medium">全て見る →</Link>
          </div>
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground text-center py-4">まだ完了記録がありません</p>
        </CardContent>
      </Card>
    );
  }

  const inner = (
    <div className="px-4">
      {!showAll && (
        <div className="flex items-center justify-between pb-3">
          <span className="text-base font-semibold text-foreground">アクティビティ</span>
          <Link href="/activity" className="text-xs text-primary font-medium">全て見る →</Link>
        </div>
      )}
      <div className="space-y-3">
        {completions.map((completion, index) => {
          const isLast = index === completions.length - 1;
          const userId = completion.user_id;
          if (!userColorMap.has(userId)) {
            userColorMap.set(userId, AVATAR_COLORS[userColorMap.size % AVATAR_COLORS.length]);
          }
          const avatarColor = userColorMap.get(userId)!;
          const initials = completion.user.name.charAt(0);

          return (
            <div key={completion.id} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full shrink-0 text-accent bg-accent/10">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-border mt-1.5" />}
              </div>
              <div className="flex-1 pb-3 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Avatar className="h-4 w-4 shrink-0">
                    <AvatarFallback className={cn("text-[8px] text-white", avatarColor)}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground truncate">{completion.user.name}さん</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(completion.completed_at)}</span>
                  <div className="ml-auto shrink-0">
                    <CompletionMenu
                      completion={completion}
                      currentUserId={currentUserId}
                      onDone={(id) => setRemovedIds((prev) => new Set([...prev, id]))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {completion.task.name}を完了
                  {completion.final_point != null && (
                    <span className="ml-1 text-accent font-medium">+{completion.final_point}pt</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (showAll) {
    return (
      <div className="bg-card rounded-xl border shadow-sm py-4">
        {inner}
      </div>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="px-0 pt-3">
        {inner}
      </CardContent>
    </Card>
  );
}
