"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
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
  imgSrc,
  color,
  index,
}: {
  label: string;
  value?: string;
  numericValue?: number;
  imgSrc: string;
  color: string;
  index: number;
}) {
  const counted = useCountUp(numericValue ?? 0);
  const displayValue = value ?? counted.toLocaleString();

  return (
    <motion.div
      variants={fadeUp}
      transition={{ ...spring, delay: index * 0.04 }}
      className="flex flex-col items-center pt-4 pb-3 px-1 rounded-2xl bg-card shadow-sm border border-border"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.08 + index * 0.07 }}
        className="mb-2.5"
      >
        <Image src={imgSrc} alt={label} width={40} height={40} />
      </motion.div>
      <div className={`text-[17px] font-bold tabular-nums leading-tight ${color}`}>
        {displayValue}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

export function TaskOverview({ completionCount, myTotalPoint, myPenaltyCount, myRank }: Props) {
  const stats = [
    {
      label: "完了",
      numericValue: completionCount,
      imgSrc: "/icons/icon-completion.PNG",
      color: "text-accent",
    },
    {
      label: "獲得pt",
      numericValue: displayPt(myTotalPoint),
      imgSrc: "/icons/icon-points.PNG",
      color: "text-primary",
    },
    {
      label: "ペナルティ",
      numericValue: myPenaltyCount,
      imgSrc: "/icons/icon-penalty.PNG",
      color: "text-destructive",
    },
    {
      label: "順位",
      value: myRank > 0 ? `${myRank}位` : "—",
      numericValue: myRank > 0 ? myRank : 0,
      imgSrc: "/icons/icon-rank.PNG",
      color: "text-chart-4",
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
