function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl skeleton-shimmer ${className ?? ""}`} />;
}

export default function ActivityLoading() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-32 h-5" />
      </div>
      <div className="bg-card rounded-xl border shadow-sm py-4 px-4 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex gap-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-10 h-3" />
              </div>
              <Skeleton className="w-40 h-2.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
