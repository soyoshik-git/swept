import Link from "next/link";
import { getStaleBadgeVariant, formatStaleDays } from "@/lib/utils";
import { calcFinalPoint } from "@/lib/points";

type Task = {
  id: string;
  name: string;
  space: string | null;
  stale_days: number;
  frequency_days: number;
  base_point: number;
};

const URGENCY = {
  red: {
    border: "border-l-red-400",
    badge: "bg-red-50 text-red-600",
    icon: "🔥",
    dot: "bg-red-400",
  },
  yellow: {
    border: "border-l-amber-400",
    badge: "bg-amber-50 text-amber-600",
    icon: "⚠️",
    dot: "bg-amber-400",
  },
  green: {
    border: "border-l-emerald-400",
    badge: "bg-emerald-50 text-emerald-600",
    icon: "✅",
    dot: "bg-emerald-400",
  },
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-3xl mb-2">✨</p>
        <p className="text-sm text-gray-400">すべて片付いています！</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {tasks.slice(0, 8).map((task) => {
        const variant = getStaleBadgeVariant(task.stale_days, task.frequency_days);
        const u = URGENCY[variant];
        const earnPt = calcFinalPoint(task.base_point, task.stale_days, task.frequency_days, 0, 1);

        return (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className={`flex items-center gap-4 pl-4 pr-5 py-4 border-l-4 ${u.border} hover:bg-gray-50/80 transition-colors`}
          >
            {/* 緊急アイコン */}
            <span className="text-xl shrink-0">{u.icon}</span>

            {/* タスク名 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{task.name}</p>
              {task.space && (
                <p className="text-xs text-gray-400 mt-0.5">{task.space}</p>
              )}
            </div>

            {/* 放置日数バッジ */}
            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${u.badge}`}>
              {formatStaleDays(task.stale_days)}
            </span>

            {/* 獲得ポイント */}
            <div className="shrink-0 text-right">
              <span className="text-base font-bold text-gray-900">+{earnPt}</span>
              <span className="text-xs text-gray-400">pt</span>
            </div>
          </Link>
        );
      })}

      {tasks.length > 8 && (
        <div className="px-5 py-3 text-center">
          <Link href="/tasks" className="text-xs font-medium text-indigo-500 hover:text-indigo-700">
            他 {tasks.length - 8} 件を見る →
          </Link>
        </div>
      )}
    </div>
  );
}
