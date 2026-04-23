import Link from "next/link";
import { getDashboardData, getWeeklySchedule } from "@/actions/stats";
import { TaskOverview } from "@/components/dashboard/TaskOverview";
import { RoommateStats } from "@/components/dashboard/RoommateStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { NeglectedTasks } from "@/components/dashboard/NeglectedTasks";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";

export default async function DashboardPage() {
  const [data, weeklySchedule] = await Promise.all([
    getDashboardData(),
    getWeeklySchedule(),
  ]);
  const isSetupNeeded = data.tasks.length === 0;

  if (isSetupNeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
          🧹
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">もう少しで使えます！</h2>
          <p className="text-sm text-muted-foreground mt-1">タスクがまだ登録されていません</p>
        </div>
        <Link
          href="/setup"
          className="mt-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          セットアップを始める →
        </Link>
      </div>
    );
  }

  // 放置タスク = stale_days >= frequency_days のもの
  const neglectedTasks = data.tasks.filter(
    (t) => t.stale_days >= t.frequency_days,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 統計タイル */}
      <TaskOverview
        completionCount={data.completionCount}
        myTotalPoint={data.myTotalPoint}
        myPenaltyCount={data.myPenaltyCount}
        myRank={data.myRank}
      />

      {/* 週間スケジュール */}
      <WeeklySchedule
        tasks={weeklySchedule.tasks}
        weekCompletions={weeklySchedule.weekCompletions}
      />

      {/* ランキング */}
      <RoommateStats stats={data.monthlyStats} />

      {/* 放置タスク */}
      {neglectedTasks.length > 0 && (
        <NeglectedTasks tasks={neglectedTasks} />
      )}

      {/* アクティビティ */}
      <RecentActivity completions={data.recentCompletions} />
    </div>
  );
}
