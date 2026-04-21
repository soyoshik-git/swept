import { getDashboardData } from "@/actions/stats";
import { Card, CardHeader } from "@/components/ui/Card";
import { PointsBar } from "@/components/dashboard/PointsBar";
import { TaskList } from "@/components/dashboard/TaskList";
import { RecentCompletions } from "@/components/dashboard/RecentCompletions";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      {/* 今月のポイント比率 */}
      <Card>
        <CardHeader title="今月のポイント比率" />
        <PointsBar stats={data.monthlyStats} />
      </Card>

      {/* タスク一覧 */}
      <Card>
        <CardHeader title="タスク（放置日数順）" />
        <TaskList tasks={data.tasks} />
      </Card>

      {/* 最近の完了ログ */}
      <Card>
        <CardHeader title="最近の完了ログ" />
        <RecentCompletions completions={data.recentCompletions} />
      </Card>
    </div>
  );
}
