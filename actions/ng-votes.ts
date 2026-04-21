"use server";

import { createClient } from "@/lib/supabase/server";
import { calcFinalPoint } from "@/lib/points";
import { revalidatePath } from "next/cache";

export async function submitNgVote(completionId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // NG投票を追加（unique制約で二重投票防止）
  const { error: voteError } = await supabase
    .from("ng_votes")
    .insert({ completion_id: completionId, user_id: user.id });

  if (voteError) throw new Error(voteError.message);

  // 完了ログとタスク情報を取得
  const { data: completion } = await supabase
    .from("completions")
    .select("*, task:tasks(base_point, frequency_days, room_id)")
    .eq("id", completionId)
    .single();
  if (!completion) throw new Error("Completion not found");

  // NG件数を取得
  const { count: ngCount } = await supabase
    .from("ng_votes")
    .select("id", { count: "exact", head: true })
    .eq("completion_id", completionId);

  // ルームの総メンバー数を取得
  const { count: totalMembers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("room_id", completion.task.room_id);

  // final_pointを再計算して更新
  const newFinalPoint = calcFinalPoint(
    completion.base_point,
    completion.stale_days,
    completion.task.frequency_days,
    ngCount ?? 0,
    totalMembers ?? 1,
  );

  const { error: updateError } = await supabase
    .from("completions")
    .update({ final_point: newFinalPoint })
    .eq("id", completionId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/");
  revalidatePath("/completions");
}
