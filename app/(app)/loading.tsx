function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl skeleton-shimmer ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* 統計タイル */}
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-card shadow-sm gap-2">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="w-8 h-5" />
            <Skeleton className="w-10 h-3" />
          </div>
        ))}
      </div>

      {/* 週間スケジュール */}
      <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
        <Skeleton className="w-24 h-4" />
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* ランキング */}
      <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
        <Skeleton className="w-20 h-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="w-20 h-3.5" />
              <Skeleton className="w-12 h-2.5" />
            </div>
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>

      {/* アクティビティ */}
      <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
        <Skeleton className="w-28 h-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="w-36 h-3" />
              <Skeleton className="w-24 h-2.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
