"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Coins, AlertCircle, Trophy } from "lucide-react";
import { staggerContainer, fadeUp, spring } from "@/lib/animate";
import { displayPt } from "@/lib/utils";

type Props = {
  completionCount: number;
  myTotalPoint: number;
  myPenaltyCount: number;
  myRank: number;
};

function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const diff = target - from;
    if (diff === 0) return;

    startRef.current = null;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(from + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

function StatCard({
  label,
  value,
  numericValue,
  icon: Icon,
  color,
  bgColor,
  index,
}: {
  label: string;
  value?: string;
  numericValue?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  index: number;
}) {
  const counted = useCountUp(numericValue ?? 0);
  const displayValue = value ?? counted.toLocaleString();

  return (
    <motion.div
      variants={fadeUp}
      transition={{ ...spring, delay: index * 0.04 }}
      className="flex flex-col items-center p-3 rounded-2xl bg-card shadow-sm"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.1 + index * 0.06 }}
        className={`p-2 rounded-xl ${bgColor} mb-2`}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </motion.div>
      <div className={`text-lg font-bold tabular-nums ${color}`}>{displayValue}</div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export function TaskOverview({ completionCount, myTotalPoint, myPenaltyCount, myRank }: Props) {
  const stats = [
    {
      label: "完了",
      numericValue: completionCount,
      icon: CheckCircle2,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "獲得pt",
      numericValue: displayPt(myTotalPoint),
      icon: Coins,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "ペナルティ",
      numericValue: myPenaltyCount,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "順位",
      value: myRank > 0 ? `${myRank}位` : "—",
      numericValue: myRank > 0 ? myRank : 0,
      icon: Trophy,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-4 gap-2"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} index={i} />
      ))}
    </motion.div>
  );
}
