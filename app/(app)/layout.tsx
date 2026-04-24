import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/actions/stats";
import { FloatingCompleteButton } from "@/components/dashboard/FloatingCompleteButton";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let roomName = "";
  let userName = "";

  if (user) {
    const { data: member } = await supabase
      .from("users")
      .select("name, room:rooms(name)")
      .eq("id", user.id)
      .single();
    roomName = (member?.room as { name?: string } | null)?.name ?? "";
    userName = member?.name ?? "";
  }

  const data = await getDashboardData().catch(() => null);
  const tasks = data?.tasks ?? [];

  const initials = userName.charAt(0) || "?";

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="px-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between h-14">
            {/* ロゴ */}
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Swept"
                width={36}
                height={36}
                className="object-contain"
              />
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">
                  Swept
                </h1>
                {roomName && (
                  <p className="text-[10px] text-muted-foreground">{roomName}</p>
                )}
              </div>
            </Link>

            {/* 右側アクション */}
            <div className="flex items-center gap-2">
              <Link href="/settings" aria-label="設定">
                <Avatar className="h-8 w-8 border-2 border-primary/20 cursor-pointer">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-24">{children}</main>

      <FloatingCompleteButton tasks={tasks} />
    </div>
  );
}
