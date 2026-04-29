"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeUp, spring } from "@/lib/animate";
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

function AnimatedPoints({ value, delay }: { value: number; delay: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => String(Math.round(v)));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      delay,
    });
    return controls.stop;
  }, [value, delay, count]);

  return <motion.span>{rounded}</motion.span>;
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

  const maxPt = Math.max(stats[0]?.net_point ?? 1, 1);

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
      <CardContent className="px-4 pb-4">
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
            const isSecond = index === 1;
            const isThird = index === 2;
            const barPct = Math.max((stat.net_point / maxPt) * 100, 0);

            return (
              <motion.div
                key={stat.id}
                variants={fadeUp}
                transition={{ ...spring, delay: index * 0.06 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl",
                  isFirst
                    ? "p-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
                    : isSecond
                      ? "p-3 bg-gray-50 border border-gray-200"
                      : isThird
                        ? "p-3 bg-orange-50/60 border border-orange-100"
                        : "p-2.5",
                )}
              >
                {/* 順位バッジ */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring, delay: 0.1 + index * 0.06 }}
                  className={cn(
                    "flex items-center justify-center shrink-0 rounded-full font-bold",
                    isFirst
                      ? "w-7 h-7 text-base bg-amber-400 text-white shadow shadow-amber-200"
                      : isSecond
                        ? "w-6 h-6 text-xs bg-gray-400 text-white"
                        : isThird
                          ? "w-6 h-6 text-xs bg-orange-400 text-white"
                          : "w-6 h-6 text-xs bg-muted text-muted-foreground",
                  )}
                >
                  {isFirst ? "👑" : index + 1}
                </motion.div>

                <Avatar className={cn("shrink-0", isFirst ? "h-9 w-9" : "h-8 w-8")}>
                  {stat.user.avatar_url && (
                    <AvatarImage src={stat.user.avatar_url} alt={stat.user.name} />
                  )}
                  <AvatarFallback className={cn("text-xs text-white font-medium", avatarColor)}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      "font-medium text-foreground truncate mb-0.5",
                      isFirst ? "text-sm font-semibold" : "text-sm",
                    )}
                  >
                    {stat.user.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mb-1.5">
                    {stat.task_count}タスク
                  </p>
                  {/* プログレスバー */}
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        isFirst
                          ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                          : isSecond
                            ? "bg-gray-400"
                            : isThird
                              ? "bg-orange-400"
                              : "bg-primary/50",
                      )}
                      initial={{ width: "0%" }}
                      animate={{ width: `${barPct}%` }}
                      transition={{
                        duration: 1,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.3 + index * 0.06,
                      }}
                    />
                  </div>
                </div>

                {/* ポイント */}
                <motion.div
                  className="text-right shrink-0"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: 0.2 + index * 0.06 }}
                >
                  <div className="flex items-baseline gap-0.5 justify-end">
                    <span
                      className={cn(
                        "font-bold text-foreground tabular-nums",
                        isFirst ? "text-base" : "text-sm",
                      )}
                    >
                      <AnimatedPoints
                        value={stat.net_point}
                        delay={0.3 + index * 0.06}
                      />
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
