import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCompletions } from "@/actions/stats";
import { ChevronLeft } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import type { Completion, Task, User } from "@/types/database";

type CompletionWithRelations = Completion & { task: Task; user: User };

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        <RecentActivity completions={completions} currentUserId={user?.id} showAll />
      )}
    </div>
  );
}
