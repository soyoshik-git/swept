import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Completion, Task, User } from "@/types/database";

type Props = {
  completions: (Completion & { task: Task; user: User })[];
};

export function RecentCompletions({ completions }: Props) {
  if (completions.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-gray-400">
        まだ完了記録がありません
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {completions.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{c.task.name}</p>
            <p className="text-xs text-gray-400">
              {c.user.name} · {formatDate(c.completed_at)}
            </p>
          </div>
          <span className="text-sm font-semibold text-blue-600">
            +{c.final_point ?? c.base_point}pt
          </span>
        </li>
      ))}
      <li className="px-4 py-2 text-right">
        <Link
          href="/completions"
          className="text-xs text-blue-600 hover:underline"
        >
          履歴を見る →
        </Link>
      </li>
    </ul>
  );
}
