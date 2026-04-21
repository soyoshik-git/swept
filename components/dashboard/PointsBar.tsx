import type { Stats } from "@/types/database";
import Link from "next/link";

export function PointsBar({ stats }: { stats: Stats[] }) {
  const total = stats.reduce((s, m) => s + m.net_point, 0);

  if (stats.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-gray-400">
        今月の記録はまだありません
      </p>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {stats.map((s) => {
        const pct = total > 0 ? Math.round((s.net_point / total) * 100) : 0;
        return (
          <div key={s.user_id}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{s.user.name}</span>
              <span>{s.net_point}pt</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-1 text-right">
        <Link href="/stats" className="text-xs text-blue-600 hover:underline">
          詳細を見る →
        </Link>
      </div>
    </div>
  );
}
