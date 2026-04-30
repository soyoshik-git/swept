"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { CheckCircle2, MoreVertical, RotateCcw, ThumbsDown, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn, displayPt } from "@/lib/utils";
import { undoCompletion, voteNG } from "@/actions/completions";
import {
  overlay, scaleIn, slideUp, sheetSpring, softSpring, fastFade,
  staggerContainer, fadeUp, spring,
} from "@/lib/animate";
import type { CompletionWithRelations } from "@/types/database";

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
  memberCount?: number;
  showAll?: boolean;
};

// ── NG確認モーダル ──
function NGModal({
  completion,
  memberCount,
  onConfirm,
  onClose,
}: {
  completion: CompletionWithRelations;
  memberCount: number;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const finalPoint = completion.final_point ?? 0;
  const penaltyPt = Math.round(finalPoint / memberCount);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black/50"
        variants={overlay}
        initial="hidden"
        animate="show"
        exit="exit"
        transition={fastFade}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-card rounded-t-2xl w-full max-w-md px-5 pt-4 pb-10"
        variants={slideUp}
        initial="hidden"
        animate="show"
        exit="exit"
        transition={sheetSpring}
      >
        <div className="flex justify-center mb-5">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <motion.div
          className="flex justify-center mb-3"
          initial={{ scale: 0, rotate: 20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 24, delay: 0.1 }}
        >
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-2xl">
            👎
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...softSpring }}
          className="space-y-4"
        >
          <div className="text-center">
            <h3 className="text-sm font-bold text-foreground">NGを出す</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{completion.task.name}</p>
          </div>

          <motion.div
            className="bg-destructive/10 rounded-xl p-3 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
          >
            <p className="text-xs text-muted-foreground">ペナルティポイント</p>
            <p className="text-2xl font-bold text-destructive">-{Math.round(displayPt(completion.final_point ?? 0) / memberCount)}pt</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {displayPt(completion.final_point)}pt ÷ {memberCount}人
            </p>
          </motion.div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">理由（任意）</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：ちゃんとできていなかった"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              キャンセル
            </button>
            <motion.button
              onClick={() => onConfirm(reason)}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-xs font-bold text-white hover:bg-destructive/90 transition-colors"
              whileTap={{ scale: 0.96 }}
            >
              NGを出す
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── ⋯ メニュー ──
function CompletionMenu({
  completion,
  currentUserId,
  memberCount,
  onDone,
}: {
  completion: CompletionWithRelations;
  currentUserId?: string;
  memberCount: number;
  onDone: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showNGModal, setShowNGModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isOwn = completion.user_id === currentUserId;
  const alreadyVoted = completion.ng_votes?.some((v) => v.user_id === currentUserId);

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

  function handleNGConfirm(reason: string) {
    setShowNGModal(false);
    startTransition(async () => {
      try {
        await voteNG(completion.id, reason || undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  }

  return (
    <>
      <AnimatePresence>
        {showNGModal && (
          <NGModal
            completion={completion}
            memberCount={memberCount}
            onConfirm={handleNGConfirm}
            onClose={() => setShowNGModal(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          disabled={isPending}
          className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-40"
          whileTap={{ scale: 0.85 }}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </motion.button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <motion.div
                className="absolute right-0 top-6 z-20 w-36 rounded-xl bg-card border border-border shadow-lg py-1 overflow-hidden"
                variants={scaleIn}
                initial="hidden"
                animate="show"
                exit="exit"
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                style={{ originX: 1, originY: 0 }}
              >
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
                    onClick={() => { setOpen(false); setShowNGModal(true); }}
                    disabled={alreadyVoted}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    {alreadyVoted ? "NG済み" : "NGを出す"}
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {error && (
          <p className="absolute right-0 top-8 z-20 text-[10px] text-destructive bg-card border border-border rounded px-2 py-1 whitespace-nowrap shadow">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

// ── メインコンポーネント ──
export function RecentActivity({
  completions: initialCompletions,
  currentUserId,
  memberCount = 1,
  showAll,
}: Props) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [listRef] = useAutoAnimate({ duration: 280 });
  const completions = initialCompletions.filter((c) => !removedIds.has(c.id));

  const userColorMap = new Map<string, string>();

  const listEl = (
    <motion.div
      className="space-y-3"
      ref={listRef}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {completions.map((completion, index) => {
          const isLast = index === completions.length - 1;
          const userId = completion.user_id;
          if (!userColorMap.has(userId)) {
            userColorMap.set(userId, AVATAR_COLORS[userColorMap.size % AVATAR_COLORS.length]);
          }
          const avatarColor = userColorMap.get(userId)!;
          const initials = completion.user.name.charAt(0);
          const ngVotes = completion.ng_votes ?? [];
          const ngReasons = ngVotes.filter((v) => v.reason).map((v) => v.reason);

          return (
            <motion.div
              key={completion.id}
              variants={fadeUp}
              transition={{ ...spring, delay: index * 0.04 }}
              className="flex gap-2.5"
            >
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full shrink-0 text-accent bg-accent/10">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-border mt-1.5" />}
              </div>
              <div className="flex-1 pb-3 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Avatar className="h-4 w-4 shrink-0">
                    {completion.user.avatar_url && (
                      <AvatarImage src={completion.user.avatar_url} alt={completion.user.name} />
                    )}
                    <AvatarFallback className={cn("text-[8px] text-white", avatarColor)}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground truncate">
                    {completion.user.name}さん
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {timeAgo(completion.completed_at)}
                  </span>
                  <div className="ml-auto shrink-0">
                    <CompletionMenu
                      completion={completion}
                      currentUserId={currentUserId}
                      memberCount={memberCount}
                      onDone={(id) => setRemovedIds((prev) => new Set([...prev, id]))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {completion.task.name}を完了
                  {completion.final_point != null && (
                    <span className="ml-1 text-accent font-medium">+{displayPt(completion.final_point)}pt</span>
                  )}
                  {ngVotes.length > 0 && (
                    <span className="ml-1.5 text-destructive text-[10px]">
                      👎 NG×{ngVotes.length}
                    </span>
                  )}
                </p>
                {ngReasons.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {ngReasons.map((reason, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground pl-1 border-l-2 border-destructive/30">
                        {reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
  );

  if (completions.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-base font-bold text-foreground leading-tight">Activity</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">アクティビティ</p>
            </div>
            <Link href="/activity" className="text-xs text-primary font-medium">全て見る →</Link>
          </div>
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground text-center py-4">まだ完了記録がありません</p>
        </CardContent>
      </Card>
    );
  }

  if (showAll) {
    return (
      <div className="bg-card rounded-xl border shadow-sm py-4 px-4">
        {listEl}
      </div>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-base font-bold text-foreground leading-tight">Activity</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">アクティビティ</p>
          </div>
          <Link href="/activity" className="text-xs text-primary font-medium">全て見る →</Link>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {listEl}
      </CardContent>
    </Card>
  );
}
