"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { calcFinalPoint, calcStaleMultiplier } from "@/lib/points";
import { buildCompletionMessage, pushMessage } from "@/lib/line";
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

  // monthly_stats を更新（RLSなしで直接書き込み）
  const admin = createAdminClient();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: existingStat } = await admin
    .from("monthly_stats")
    .select("id, total_point, penalty_pt, net_point")
    .eq("room_id", member.room_id)
    .eq("user_id", authUser.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (existingStat) {
    const newTotal = (existingStat.total_point ?? 0) + finalPoint;
    const penaltyPt = existingStat.penalty_pt ?? 0;
    await admin
      .from("monthly_stats")
      .update({ total_point: newTotal, net_point: newTotal - penaltyPt })
      .eq("id", existingStat.id);
  } else {
    await admin.from("monthly_stats").insert({
      room_id: member.room_id,
      user_id: authUser.id,
      year,
      month,
      total_point: finalPoint,
      penalty_pt: 0,
      net_point: finalPoint,
    });
  }

  // LINE通知（失敗してもエラーにしない）
  const lineGroupId = task.room?.line_group_id;
  if (lineGroupId) {
    const text = buildCompletionMessage(member.name, task.name, finalPoint);
    pushMessage(lineGroupId, text).catch(console.error);
  }

  revalidatePath("/");
  revalidatePath("/completions");
  revalidatePath("/activity");
  return completion;
}

/** 自分の完了を取り消す */
export async function undoCompletion(completionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  const { data: completion } = await admin
    .from("completions")
    .select("user_id, final_point, completed_at, task:tasks(room_id)")
    .eq("id", completionId)
    .single();

  if (!completion) throw new Error("完了記録が見つかりません");
  if (completion.user_id !== user.id) throw new Error("自分の完了記録のみ取り消せます");

  // monthly_stats を差し引き
  const completedAt = new Date(completion.completed_at);
  const year = completedAt.getFullYear();
  const month = completedAt.getMonth() + 1;
  const roomId = (completion.task as unknown as { room_id: string } | null)?.room_id;

  if (roomId && completion.final_point) {
    const { data: stat } = await admin
      .from("monthly_stats")
      .select("id, total_point, penalty_pt")
      .eq("user_id", user.id)
      .eq("room_id", roomId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (stat) {
      const newTotal = Math.max(0, (stat.total_point ?? 0) - completion.final_point);
      await admin
        .from("monthly_stats")
        .update({ total_point: newTotal, net_point: newTotal - (stat.penalty_pt ?? 0) })
        .eq("id", stat.id);
    }
  }

  await admin.from("completions").delete().eq("id", completionId);

  revalidatePath("/");
  revalidatePath("/activity");
}

/** 他人の完了に NG を出す */
export async function voteNG(completionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await supabase
    .from("ng_votes")
    .select("id")
    .eq("completion_id", completionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) throw new Error("すでに NG を出しています");

  const { error } = await supabase
    .from("ng_votes")
    .insert({ completion_id: completionId, user_id: user.id, voted_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/activity");
}
