import { createClient } from "@/lib/supabase/server";
import { submitNgVote } from "@/actions/ng-votes";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function CompletionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user!.id)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("room_id", member?.room_id ?? "");

  const taskIds = (tasks ?? []).map((t) => t.id);

  const { data: completions } = await supabase
    .from("completions")
    .select("*, task:tasks(name), user:users(name)")
    .in("task_id", taskIds.length ? taskIds : [""])
    .order("completed_at", { ascending: false })
    .limit(50);

  // 自分がNG投票済みのcompletion IDを取得
  const { data: myVotes } = await supabase
    .from("ng_votes")
    .select("completion_id")
    .eq("user_id", user!.id);

  const votedIds = new Set((myVotes ?? []).map((v) => v.completion_id));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">完了履歴</h1>
      <Card>
        <CardHeader title="直近50件" />
        {!completions || completions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            完了記録がありません
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {completions.map((c) => {
              const alreadyVoted = votedIds.has(c.id);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.task.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.user.name} · {formatDate(c.completed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-blue-600">
                      +{c.final_point ?? c.base_point}pt
                    </span>
                    {!alreadyVoted && c.user_id !== user!.id && (
                      <form
                        action={async () => {
                          "use server";
                          await submitNgVote(c.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                        >
                          NG
                        </button>
                      </form>
                    )}
                    {alreadyVoted && (
                      <span className="text-xs text-gray-400">NG済</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
