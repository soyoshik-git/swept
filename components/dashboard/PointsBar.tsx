import type { Stats } from "@/types/database";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

const RANK_STYLES = [
  { bar: "bg-gradient-to-r from-amber-400 to-orange-400", text: "text-amber-600" },
  { bar: "bg-gradient-to-r from-slate-300 to-slate-400", text: "text-slate-500" },
  { bar: "bg-gradient-to-r from-amber-600 to-amber-700", text: "text-amber-700" },
];
const DEFAULT_STYLE = { bar: "bg-gradient-to-r from-indigo-400 to-indigo-500", text: "text-indigo-500" };

export function PointsBar({ stats }: { stats: Stats[] }) {
  const max = Math.max(...stats.map((s) => s.net_point), 1);
  const total = stats.reduce((s, m) => s + m.net_point, 0);

  if (stats.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-sm text-muted-foreground">今月の記録はまだありません</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-5 space-y-4">
      {stats.map((s, i) => {
        const pct = Math.round((s.net_point / max) * 100);
        const share = total > 0 ? Math.round((s.net_point / total) * 100) : 0;
        const style = RANK_STYLES[i] ?? DEFAULT_STYLE;

        return (
          <div key={s.user_id} className="flex items-center gap-3">
            <div className="w-7 text-xl text-center shrink-0 leading-none">
              {MEDALS[i] ?? <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold truncate">{s.user.name}</span>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">{share}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", style.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="shrink-0 text-right min-w-[3rem]">
              <span className={cn("text-lg font-bold", style.text)}>{s.net_point}</span>
              <span className="text-xs text-muted-foreground ml-0.5">pt</span>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">合計 <span className="font-semibold text-foreground">{total}pt</span></span>
        <Link href="/stats" className="text-xs font-medium text-indigo-500 hover:text-indigo-700">
          月次統計 →
        </Link>
      </div>
    </div>
  );
}
