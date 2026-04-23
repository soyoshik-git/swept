import { Trophy, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Stats } from "@/types/database";

const AVATAR_COLORS = [
  "bg-primary",
  "bg-accent",
  "bg-chart-5",
  "bg-chart-4",
  "bg-chart-1",
  "bg-chart-2",
];

function getInitials(name: string): string {
  if (!name) return "?";
  return name.charAt(0);
}

type Props = {
  stats: Stats[];
};

export function RoommateStats({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-base text-foreground">ランキング</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            今月のデータがまだありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">ランキング</CardTitle>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Trophy className="w-3 h-3 text-chart-4" />
            今月
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-2">
          {stats.map((stat, index) => {
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const initials = getInitials(stat.user.name);

            return (
              <div
                key={stat.id}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl transition-all",
                  index === 0 ? "bg-chart-4/10" : "",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0",
                    index === 0
                      ? "bg-chart-4 text-white"
                      : index === 1
                        ? "bg-gray-400 text-white"
                        : index === 2
                          ? "bg-orange-400 text-white"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </div>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={cn("text-xs text-white font-medium", avatarColor)}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {stat.user.name}
                    </h4>
                    {index === 0 && (
                      <Star className="w-3 h-3 text-chart-4 fill-chart-4 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {stat.task_count}タスク
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 justify-end">
                    <span className="text-sm font-bold text-foreground">
                      {stat.net_point}
                    </span>
                    <span className="text-[10px] text-muted-foreground">pt</span>
                  </div>
                  <div className="flex items-center gap-0.5 justify-end text-muted-foreground">
                    <Minus className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
