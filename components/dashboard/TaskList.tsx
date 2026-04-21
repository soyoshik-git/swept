import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { getStaleBadgeVariant, formatStaleDays } from "@/lib/utils";

type Task = {
  id: string;
  name: string;
  space: string | null;
  stale_days: number;
  frequency_days: number;
  base_point: number;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-gray-400">
        タスクがありません
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {tasks.slice(0, 8).map((task) => {
        const variant = getStaleBadgeVariant(task.stale_days, task.frequency_days);
        return (
          <li key={task.id}>
            <Link
              href={`/tasks/${task.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{task.name}</p>
                {task.space && (
                  <p className="text-xs text-gray-400">{task.space}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{task.base_point}pt</span>
                <Badge variant={variant}>{formatStaleDays(task.stale_days)}</Badge>
              </div>
            </Link>
          </li>
        );
      })}
      <li className="px-4 py-2 text-right">
        <Link href="/tasks" className="text-xs text-blue-600 hover:underline">
          すべて見る →
        </Link>
      </li>
    </ul>
  );
}
