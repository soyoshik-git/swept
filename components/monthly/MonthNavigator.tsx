"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  year: number;
  month: number;
};

export function MonthNavigator({ year, month }: Props) {
  const router = useRouter();
  const now = new Date();
  const isLatest =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    router.push(`/monthly?year=${y}&month=${m}`);
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-bold text-foreground">
        {year}年{month}月の集計
      </h1>
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="前の月"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate(1)}
          disabled={isLatest}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="次の月"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
