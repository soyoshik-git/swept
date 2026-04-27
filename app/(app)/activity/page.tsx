import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCompletions } from "@/actions/stats";
import { ChevronLeft } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import type { CompletionWithRelations } from "@/types/database";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // メンバー数を取得
  let memberCount = 1;
  if (user) {
    const { data: member } = await supabase
      .from("users")
      .select("room_id")
      .eq("id", user.id)
      .single();
    if (member?.room_id) {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("room_id", member.room_id);
      memberCount = count ?? 1;
    }
  }

  const completions = (await getAllCompletions(0, 200).catch(() => [])) as CompletionWithRelations[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-base font-bold text-foreground">アクティビティ履歴</h2>
      </div>

      {completions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">まだ完了記録がありません</p>
      ) : (
        <RecentActivity completions={completions} currentUserId={user?.id} memberCount={memberCount} showAll />
      )}
    </div>
  );
}
