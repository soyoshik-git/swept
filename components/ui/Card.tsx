export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      {action}
    </div>
  );
}
