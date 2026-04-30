"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
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
      <Card className="border shadow-sm">
        <CardHeader className="px-4 pb-3">
          <div>
            <p className="font-heading text-base font-bold text-foreground leading-tight">Ranking</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">ランキング</p>
          </div>
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
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-base font-bold text-foreground leading-tight">Ranking</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">ランキング</p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
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
            const isSecond = index === 1;
            const isThird = index === 2;
            const barPct = Math.max((stat.net_point / maxPt) * 100, 0);

            return (
              <motion.div
                key={stat.id}
                variants={fadeUp}
                transition={{ ...spring, delay: index * 0.06 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3",
                  isFirst
                    ? "bg-primary/8 border border-primary/20"
                    : isSecond
                      ? "bg-muted/60 border border-border"
                      : isThird
                        ? "bg-muted/40 border border-border"
                        : "bg-muted/20",
                )}
              >
                {/* 順位バッジ */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...spring, delay: 0.1 + index * 0.06 }}
                  className="flex items-center justify-center shrink-0 w-7 h-7 text-xl"
                >
                  {isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : (
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                <Avatar className="h-8 w-8 shrink-0">
                  {stat.user.avatar_url && (
                    <AvatarImage src={stat.user.avatar_url} alt={stat.user.name} />
                  )}
                  <AvatarFallback className={cn("text-xs text-white font-semibold", avatarColor)}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className={cn(
                        "text-sm text-foreground truncate leading-tight",
                        isFirst ? "font-semibold" : "font-medium",
                      )}>
                        {stat.user.name}
                      </h4>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {stat.task_count}件
                      </span>
                    </div>
                    <motion.div
                      className="flex items-baseline gap-0.5 shrink-0"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring, delay: 0.2 + index * 0.06 }}
                    >
                      <span className={cn(
                        "font-bold text-primary tabular-nums",
                        isFirst ? "text-[15px]" : "text-sm",
                      )}>
                        <AnimatedPoints value={stat.net_point} delay={0.3 + index * 0.06} />
                      </span>
                      <span className="text-[11px] text-muted-foreground">pt</span>
                    </motion.div>
                  </div>
                  {/* プログレスバー */}
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        isFirst
                          ? "bg-gradient-primary"
                          : isSecond
                            ? "bg-muted-foreground/50"
                            : isThird
                              ? "bg-muted-foreground/35"
                              : "bg-muted-foreground/25",
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
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}

