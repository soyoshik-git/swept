import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Completion, Task, User } from "@/types/database";

type CompletionWithRelations = Completion & { task: Task; user: User };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

const AVATAR_COLORS = [
  "bg-primary",
  "bg-accent",
  "bg-chart-5",
  "bg-chart-4",
  "bg-chart-1",
  "bg-chart-2",
];

type Props = {
  completions: CompletionWithRelations[];
};

export function RecentActivity({ completions }: Props) {
  if (completions.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-base text-foreground">アクティビティ</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            まだ完了記録がありません
          </p>
        </CardContent>
      </Card>
    );
  }

  // Deduplicate user colors by user id
  const userColorMap = new Map<string, string>();

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">アクティビティ</CardTitle>
          <Link href="/activity" className="text-xs text-primary font-medium">
            全て見る →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4">
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
                      <AvatarFallback
                        className={cn("text-[8px] text-white", avatarColor)}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground truncate">
                      {completion.user.name}さん
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(completion.completed_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {completion.task.name}を完了
                    {completion.final_point != null && (
                      <span className="ml-1 text-accent font-medium">
                        +{completion.final_point}pt
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
