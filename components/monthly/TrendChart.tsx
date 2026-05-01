"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

type Props = {
  months: { year: number; month: number; label: string }[];
  series: { userId: string; name: string; data: (number | null)[] }[];
};

export function TrendChart({ months, series }: Props) {
  const data = months.map((m, i) => {
    const entry: Record<string, string | number | null> = { label: m.label };
    for (const s of series) {
      entry[s.userId] = s.data[i];
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) => {
            const s = series.find((s) => s.userId === name);
            return [`${value}pt`, s?.name ?? String(name)];
          }}
        />
        <Legend
          formatter={(value) => {
            const s = series.find((s) => s.userId === value);
            return s?.name ?? String(value);
          }}
        />
        {series.map((s, i) => (
          <Line
            key={s.userId}
            type="monotone"
            dataKey={s.userId}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
