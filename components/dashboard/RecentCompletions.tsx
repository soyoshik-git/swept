import Link from "next/link";
import type { Completion, Task, User } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  completions: (Completion & { task: Task; user: User })[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}時間前`;
  return `${Math.floor(hrs / 24)}日前`;
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
];

export function RecentCompletions({ completions }: Props) {
  if (completions.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-4xl mb-3">🧹</p>
        <p className="text-sm text-muted-foreground">まだ完了記録がありません</p>
      </div>
    );
  }

  const colorMap = new Map<string, string>();
  let colorIdx = 0;
  function getColor(userId: string): string {
    if (!colorMap.has(userId)) {
      colorMap.set(userId, AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]);
      colorIdx++;
    }
    return colorMap.get(userId)!;
  }

  return (
    <div className="divide-y divide-border">
      {completions.map((c) => {
        const pt = c.final_point ?? c.base_point;
        const avatarColor = getColor(c.user_id);
        return (
          <div key={c.id} className="flex items-center gap-3 px-6 py-3.5">
            {/* アバター */}
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              avatarColor
            )}>
              {c.user.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{c.task.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.user.name} · {timeAgo(c.completed_at)}
              </p>
            </div>

            <div className="shrink-0 bg-emerald-50 text-emerald-700 font-bold text-sm px-2.5 py-1 rounded-lg border border-emerald-100">
              +{pt}pt
            </div>
          </div>
        );
      })}

      <div className="px-6 py-3 text-center">
        <Link href="/completions" className="text-xs font-medium text-indigo-500 hover:text-indigo-700">
          すべての履歴 →
        </Link>
      </div>
    </div>
  );
}
