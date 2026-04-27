"use client";

import { motion } from "motion/react";
import { Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeUp, spring } from "@/lib/animate";
import { displayPt } from "@/lib/utils";
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
    <Card className="border-none shadow-sm overflow-hidden">
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
        <motion.div
          className="space-y-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {stats.map((stat, index) => {
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const initials = getInitials(stat.user.name);
            const isFirst = index === 0;

            return (
              <motion.div
                key={stat.id}
                variants={fadeUp}
                transition={{ ...spring, delay: index * 0.06 }}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl transition-colors",
                  isFirst ? "bg-chart-4/10" : "",
                )}
              >
                {/* 順位バッジ */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring, delay: 0.15 + index * 0.06 }}
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0",
                    isFirst
                      ? "bg-chart-4 text-white"
                      : index === 1
                        ? "bg-gray-400 text-white"
                        : index === 2
                          ? "bg-orange-400 text-white"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </motion.div>

                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn("text-xs text-white font-medium", avatarColor)}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {stat.user.name}
                    </h4>
                    {isFirst && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.4 }}
                      >
                        <Star className="w-3 h-3 text-chart-4 fill-chart-4 shrink-0" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {stat.task_count}タスク
                  </p>
                </div>

                <motion.div
                  className="text-right shrink-0"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: 0.2 + index * 0.06 }}
                >
                  <div className="flex items-baseline gap-0.5 justify-end">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {displayPt(stat.net_point)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">pt</span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}
