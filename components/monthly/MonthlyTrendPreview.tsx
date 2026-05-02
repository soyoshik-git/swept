"use client";

import Link from "next/link";
import { TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { DailyTrendChart } from "./DailyTrendChart";

type Props = {
  days: string[];
  series: { userId: string; name: string; data: (number | null)[] }[];
  year: number;
  month: number;
};

export function MonthlyTrendPreview({ days, series, year, month }: Props) {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-base font-bold text-foreground leading-tight">
              Monthly
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {month}月の日次ポイント推移
            </p>
          </div>
          <Link
            href={`/monthly?year=${year}&month=${month}`}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <TrendingUp className="w-3 h-3" />
            月次履歴
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <Link
          href={`/monthly?year=${year}&month=${month}`}
          className="block"
          tabIndex={-1}
          aria-label="月次履歴ページへ"
        >
          <DailyTrendChart days={days} series={series} />
        </Link>
      </CardContent>
    </Card>
  );
}
