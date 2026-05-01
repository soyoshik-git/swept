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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-md text-xs space-y-1.5">
      <p className="text-muted-foreground font-medium">{label}日</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-foreground">{entry.name}</span>
            </div>
            <span className="font-semibold tabular-nums">{entry.value}pt</span>
          </div>
        ),
      )}
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
          <span
            className="w-3 h-px rounded-full inline-block"
            style={{ background: entry.color, height: "2px" }}
          />
          <span className="text-[10px] text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  days: string[];
  series: { userId: string; name: string; data: number[] }[];
};

export function DailyTrendChart({ days, series }: Props) {
  const data = days.map((day, i) => {
    const entry: Record<string, string | number> = { label: day };
    for (const s of series) {
      entry[s.userId] = s.data[i];
    }
    return entry;
  });

  // X軸は5日おきのみ表示
  const xTicks = days.filter((d) => Number(d) % 5 === 0 || d === "1");

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.userId} id={`daily-grad-${s.userId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.12} />
              <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
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
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={1.5}
            fill={`url(#daily-grad-${s.userId})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
