import Link from "next/link";
import { getDashboardData } from "@/actions/stats";
import { FloatingCompleteButton } from "@/components/dashboard/FloatingCompleteButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDashboardData().catch(() => null);
  const tasks = data?.tasks ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 h-14">
          <Link href="/" className="text-base font-bold text-gray-900">
            🧹 クリーン当番
          </Link>
          <Link
            href="/settings"
            className="text-gray-400 hover:text-gray-700 transition-colors text-xl"
            aria-label="設定"
          >
            ⚙️
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">{children}</main>

      <FloatingCompleteButton tasks={tasks} />
    </div>
  );
}
