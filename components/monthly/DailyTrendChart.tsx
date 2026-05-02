"use client";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const CHART_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
];

const PLACEHOLDER_COLORS = ["#94a3b8", "#cbd5e1"];

function makePlaceholderSeries(length: number) {
  return [
    {
      userId: "ph0",
      name: "—",
      data: Array.from({ length }, (_, i) =>
        Math.round(40 + i * 8 + Math.sin(i * 0.55) * 14),
      ),
    },
    {
      userId: "ph1",
      name: "—",
      data: Array.from({ length }, (_, i) =>
        Math.round(20 + i * 5 + Math.cos(i * 0.45) * 9),
      ),
    },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-md text-xs space-y-1.5">
      <p className="text-muted-foreground font-medium">{label}日</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-foreground">{entry.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{entry.value}pt</span>
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

type Series = { userId: string; name: string; data: (number | null)[] };

type Props = {
  days: string[];
  series: Series[];
};

function Chart({ days, series, colors }: { days: string[]; series: Series[]; colors: string[] }) {
  const data = days.map((day, i) => {
    const entry: Record<string, string | number | null> = { label: day };
    for (const s of series) entry[s.userId] = s.data[i] ?? null;
    return entry;
  });

  const xTicks = days.filter((d) => Number(d) % 5 === 0 || d === "1");

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.userId} id={`daily-grad-${s.userId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.12} />
              <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <XAxis
          dataKey="label"
          ticks={xTicks}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
        <Legend content={<ChartLegend />} />
        {series.map((s, i) => (
          <Area
            key={s.userId}
            type="monotone"
            dataKey={s.userId}
            name={s.name}
            stroke={colors[i % colors.length]}
            strokeWidth={1.5}
            fill={`url(#daily-grad-${s.userId})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            connectNulls={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DailyTrendChart({ days, series }: Props) {
  const isEmpty = series.length === 0;
  const displayDays = isEmpty ? Array.from({ length: 30 }, (_, i) => String(i + 1)) : days;
  const displaySeries = isEmpty ? makePlaceholderSeries(30) : series;
  const colors = isEmpty ? PLACEHOLDER_COLORS : CHART_COLORS;

  return (
    <div className="relative">
      <div className={isEmpty ? "opacity-20 pointer-events-none select-none" : undefined}>
        <Chart days={displayDays} series={displaySeries} colors={colors} />
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
