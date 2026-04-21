import { getMonthlyStats } from "@/actions/stats";
import { Card, CardHeader } from "@/components/ui/Card";

export default async function StatsPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const stats = await getMonthlyStats(year, month);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">
        {year}年{month}月の集計
      </h1>

      <Card>
        <CardHeader title="ポイントランキング" />
        {stats.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            今月の記録がまだありません
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {stats.map((s, i) => (
              <li
                key={s.user_id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="text-xl w-8 text-center">
                  {medals[i] ?? ""}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {s.user.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    獲得 {s.total_point}pt
                    {s.penalty_pt > 0 && (
                      <span className="text-red-500">
                        {" "}
                        ペナルティ -{s.penalty_pt}pt
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-base font-bold text-blue-700">
                  {s.net_point}pt
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
