"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function generateRoomCode(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

/** 新しいルームを作成してユーザーを所属させる */
export async function setupCreateRoom(name: string): Promise<void> {
  // 認証確認は通常クライアントで
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // RLS をバイパスするために admin クライアントを使用
  const admin = createAdminClient();

  // ユニークなコードを生成
  let code = generateRoomCode();
  for (let i = 0; i < 10; i++) {
    const { data: dup } = await admin
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!dup) break;
    code = generateRoomCode();
  }

  const { data: room, error: roomError } = await admin
    .from("rooms")
    .insert({ name: name.trim(), code })
    .select("id")
    .single();
  if (roomError) throw new Error(roomError.message);

  // users レコードを upsert（初回ログイン時はレコードがない）
  const { error: userError } = await admin.from("users").upsert(
    { id: user.id, room_id: room.id, name: user.email?.split("@")[0] ?? "メンバー" },
    { onConflict: "id" },
  );
  if (userError) throw new Error(userError.message);

  revalidatePath("/");
}

/** コードで既存ルームに参加 */
export async function joinRoomByCode(code: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();

  const { data: room } = await admin
    .from("rooms")
    .select("id, name")
    .eq("code", code.trim())
    .maybeSingle();

  if (!room) throw new Error("ルームが見つかりません。コードを確認してください。");

  const { error } = await admin.from("users").upsert(
    { id: user.id, room_id: room.id, name: user.email?.split("@")[0] ?? "メンバー" },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

/** ルーム名を変更 */
export async function setupRoomName(name: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) throw new Error("Room not found");

  const { error } = await supabase
    .from("rooms")
    .update({ name: name.trim() })
    .eq("id", member.room_id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

/** 最初のタスクを追加 */
export async function setupFirstTask(data: {
  name: string;
  space: string;
  base_point: number;
  frequency_days: number;
}): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) throw new Error("Room not found");

  const { error } = await supabase.from("tasks").insert({
    ...data,
    room_id: member.room_id,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

/** 招待トークンを生成 */
export async function setupCreateInviteToken(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) throw new Error("Room not found");

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("invite_tokens").insert({
    room_id: member.room_id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(error.message);
  return token;
}
