function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl skeleton-shimmer ${className ?? ""}`} />;
}

export default function TasksLoading() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-20 h-8 rounded-lg" />
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="flex-1 space-y-2">
              <Skeleton className="w-32 h-4" />
              <div className="flex gap-2">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-12 h-3" />
              </div>
            </div>
            <Skeleton className="w-14 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
