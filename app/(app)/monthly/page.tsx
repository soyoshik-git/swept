import { getMonthlyHistory } from "@/actions/stats";
import { Card, CardHeaderCompat as CardHeader } from "@/components/ui/Card";
import { MonthNavigator } from "@/components/monthly/MonthNavigator";
import { TrendChart } from "@/components/monthly/TrendChart";
import { displayPt } from "@/lib/utils";

export default async function MonthlyPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

  const data = await getMonthlyHistory(year, month).catch(() => null);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <MonthNavigator year={year} month={month} />

      <Card>
        <CardHeader title="ポイントランキング" />
        {!data || data.ranking.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            この月のデータがありません
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.ranking.map((s, i) => (
              <li key={s.user_id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl w-8 text-center shrink-0">
                  {medals[i] ?? ""}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {s.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    完了 {s.task_count}回 ・ 獲得 {displayPt(s.total_point)}pt
                    {s.penalty_pt > 0 && (
                      <span className="text-destructive">
                        {" "}ペナルティ -{displayPt(s.penalty_pt)}pt
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-base font-bold text-blue-600 shrink-0">
                  {displayPt(s.net_point)}pt
                </span>
              </li>
            ))}
          </ul>
        )}
        {data?.isCurrentMonth && (
          <p className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            * 今月のデータは月末に確定されます
          </p>
        )}
      </Card>

      {data && data.trend.series.length > 0 && (
        <Card>
          <CardHeader title="ポイント推移（過去6ヶ月）" />
          <div className="px-2 py-4">
            <TrendChart
              months={data.trend.months}
              series={data.trend.series}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
