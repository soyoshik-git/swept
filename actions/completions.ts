"use server";

import { createClient } from "@/lib/supabase/server";
import { calcFinalPoint, calcStaleMultiplier } from "@/lib/points";
import {
  buildCompletionMessage,
  pushMessage,
} from "@/lib/line";
import { revalidatePath } from "next/cache";
import type { Completion } from "@/types/database";

export async function completeTask(taskId: string): Promise<Completion> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Unauthorized");

  // タスク・ルーム情報を取得
  const { data: task } = await supabase
    .from("tasks")
    .select("*, room:rooms(id, line_group_id)")
    .eq("id", taskId)
    .single();
  if (!task) throw new Error("Task not found");

  // 実行ユーザー情報を取得
  const { data: member } = await supabase
    .from("users")
    .select("id, name, room_id")
    .eq("id", authUser.id)
    .single();
  if (!member) throw new Error("User not found");

  // ルームの総メンバー数を取得
  const { count: totalMembers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("room_id", member.room_id);

  // 最終完了日を取得して放置日数を計算
  const { data: lastCompletion } = await supabase
    .from("completions")
    .select("completed_at")
    .eq("task_id", taskId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();
  const staleDays = lastCompletion
    ? Math.floor(
        (now.getTime() - new Date(lastCompletion.completed_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const finalPoint = calcFinalPoint(
    task.base_point,
    staleDays,
    task.frequency_days,
    0,
    totalMembers ?? 1,
  );

  // 完了ログを保存
  const { data: completion, error } = await supabase
    .from("completions")
    .insert({
      task_id: taskId,
      user_id: authUser.id,
      base_point: task.base_point,
      stale_days: staleDays,
      final_point: finalPoint,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // LINE通知（失敗してもエラーにしない）
  const lineGroupId = task.room?.line_group_id;
  if (lineGroupId) {
    const text = buildCompletionMessage(member.name, task.name, finalPoint);
    pushMessage(lineGroupId, text).catch(console.error);
  }

  revalidatePath("/");
  revalidatePath("/completions");
  return completion;
}
