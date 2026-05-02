"use client";

import dynamic from "next/dynamic";

const TrendChart = dynamic(
  () => import("./TrendChart").then((m) => ({ default: m.TrendChart })),
  { ssr: false, loading: () => <div className="h-[200px]" /> },
);

type Props = {
  months: { year: number; month: number; label: string }[];
  series: { userId: string; name: string; data: (number | null)[] }[];
};

export function TrendChartWrapper({ months, series }: Props) {
  return <TrendChart months={months} series={series} />;
}
