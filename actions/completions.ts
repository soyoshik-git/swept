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
    .select("*, room:rooms(id, line_group_id, bonus_multiplier_max)")
    .eq("id", taskId)
    .single();
  if (!task) throw new Error("Task not found");

  // 固定担当タスクは担当者本人のみ完了可能
  if (task.is_fixed_assign && task.assigned_user_id && task.assigned_user_id !== authUser.id) {
    throw new Error("このタスクは担当者のみ完了できます");
  }

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
  const referenceDate = lastCompletion
    ? new Date(lastCompletion.completed_at)
    : new Date(task.created_at);
  const staleDays = Math.floor(
    (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const bonusMax = (task.room as { bonus_multiplier_max?: number } | null)?.bonus_multiplier_max ?? 2.0;
  const finalPoint = calcFinalPoint(
    task.base_point,
    staleDays,
    task.frequency_days,
    0,
    totalMembers ?? 1,
    bonusMax,
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

/** フリータスクを完了する */
export async function completeFreeTask(data: {
  name: string;
  notes: string | null;
  point: number;
}): Promise<void> {
  const { name, notes, point } = data;
  if (!name.trim()) throw new Error("タスク名を入力してください");
  if (![10, 20, 30, 40].includes(point)) throw new Error("ポイントは10・20・30・40のいずれかを指定してください");

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("id, name, room_id, room:rooms(line_group_id)")
    .eq("id", authUser.id)
    .single();
  if (!member) throw new Error("User not found");

  // ルームのフリータスクを取得
  const { data: freeTask } = await supabase
    .from("tasks")
    .select("id")
    .eq("room_id", member.room_id)
    .eq("is_free_task", true)
    .single();
  if (!freeTask) throw new Error("フリータスクが見つかりません");

  const { data: completion, error } = await supabase
    .from("completions")
    .insert({
      task_id: freeTask.id,
      user_id: authUser.id,
      base_point: point,
      stale_days: 0,
      final_point: point,
      free_task_name: name.trim(),
      notes: notes?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // monthly_stats を更新
  const admin = createAdminClient();
  const now = new Date();
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
    const newTotal = (existingStat.total_point ?? 0) + point;
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
      total_point: point,
      penalty_pt: 0,
      net_point: point,
    });
  }

  // LINE通知（失敗してもエラーにしない）
  const lineGroupId = (member.room as unknown as { line_group_id?: string } | null)?.line_group_id;
  if (lineGroupId) {
    const text = buildCompletionMessage(member.name, name.trim(), point);
    pushMessage(lineGroupId, text).catch(console.error);
  }

  revalidatePath("/");
  revalidatePath("/completions");
  revalidatePath("/activity");
  void completion;
}

/** 放置タスクの放置日数をリセットする（ポイントなし） */
export async function skipTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("completions")
    .insert({
      task_id: taskId,
      user_id: authUser.id,
      base_point: 0,
      stale_days: 0,
      final_point: 0,
      notes: "__skip__",
    });

  if (error) throw new Error(error.message);

  revalidatePath("/");
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
export async function voteNG(completionId: string, reason?: string): Promise<{ penaltyPt: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  // 既にNG済みか確認
  const { data: existing } = await supabase
    .from("ng_votes")
    .select("id")
    .eq("completion_id", completionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) throw new Error("すでに NG を出しています");

  // 完了記録とルーム情報を取得
  const { data: completion } = await admin
    .from("completions")
    .select("user_id, final_point, completed_at, task:tasks(room_id)")
    .eq("id", completionId)
    .single();

  if (!completion) throw new Error("完了記録が見つかりません");
  if (completion.user_id === user.id) throw new Error("自分の完了には NG を出せません");

  const roomId = (completion.task as unknown as { room_id: string } | null)?.room_id;
  if (!roomId) throw new Error("ルーム情報が見つかりません");

  // ルームのメンバー数を取得してペナルティを計算
  const { count: memberCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);

  const totalMembers = memberCount ?? 1;
  const finalPoint = completion.final_point ?? 0;
  const penaltyPt = Math.round(finalPoint / totalMembers);

  // NG投票を記録
  const { error } = await supabase
    .from("ng_votes")
    .insert({
      completion_id: completionId,
      user_id: user.id,
      voted_at: new Date().toISOString(),
      reason: reason ?? null,
    });

  if (error) throw new Error(error.message);

  // 対象ユーザーの monthly_stats に penalty_pt を加算
  if (penaltyPt > 0) {
    const completedAt = new Date(completion.completed_at);
    const year = completedAt.getFullYear();
    const month = completedAt.getMonth() + 1;

    const { data: stat } = await admin
      .from("monthly_stats")
      .select("id, total_point, penalty_pt")
      .eq("user_id", completion.user_id)
      .eq("room_id", roomId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (stat) {
      const newPenalty = (stat.penalty_pt ?? 0) + penaltyPt;
      const newNet = Math.max(0, (stat.total_point ?? 0) - newPenalty);
      await admin
        .from("monthly_stats")
        .update({ penalty_pt: newPenalty, net_point: newNet })
        .eq("id", stat.id);
    } else {
      await admin.from("monthly_stats").insert({
        room_id: roomId,
        user_id: completion.user_id,
        year,
        month,
        total_point: 0,
        penalty_pt: penaltyPt,
        net_point: 0,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/activity");
  return { penaltyPt };
}
