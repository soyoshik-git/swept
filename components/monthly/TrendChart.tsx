"use client";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "./DailyTrendChart";

const PLACEHOLDER_COLORS = ["#94a3b8", "#cbd5e1"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-md text-xs space-y-1.5">
      <p className="text-muted-foreground font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-foreground">{entry.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{entry.value ?? "—"}pt</span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 pt-1">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="w-3 rounded-full inline-block" style={{ background: entry.color, height: "2px" }} />
          <span className="text-[10px] text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  months: { year: number; month: number; label: string }[];
  series: { userId: string; name: string; data: (number | null)[] }[];
};

const PLACEHOLDER_VALUES = [
  [80, 120, 90, 160, 130, 200],
  [50, 70, 110, 80, 140, 100],
];

export function TrendChart({ months, series }: Props) {
  const isEmpty = series.length === 0;

  const displaySeries = isEmpty
    ? PLACEHOLDER_VALUES.map((vals, i) => ({
        userId: `ph${i}`,
        name: "—",
        data: vals as (number | null)[],
      }))
    : series;

  const colors = isEmpty ? PLACEHOLDER_COLORS : CHART_COLORS;

  const data = months.map((m, i) => {
    const entry: Record<string, string | number | null> = { label: m.label };
    for (const s of displaySeries) entry[s.userId] = s.data[i] ?? null;
    return entry;
  });

  return (
    <div className="relative">
      <div className={isEmpty ? "opacity-20 pointer-events-none select-none" : undefined}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
            <defs>
              {displaySeries.map((s, i) => (
                <linearGradient key={s.userId} id={`trend-grad-${s.userId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Legend content={<ChartLegend />} />
            {displaySeries.map((s, i) => (
              <Area
                key={s.userId}
                type="monotone"
                dataKey={s.userId}
                name={s.name}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                fill={`url(#trend-grad-${s.userId})`}
                dot={{ r: 3, fill: colors[i % colors.length], strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
            まだ記録がありません
          </span>
        </div>
      )}
    </div>
  );
}
