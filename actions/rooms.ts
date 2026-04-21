"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createInviteToken(): Promise<string> {
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
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日後

  const { error } = await supabase.from("invite_tokens").insert({
    room_id: member.room_id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(error.message);

  return token;
}

export async function joinRoom(token: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // トークンを検証
  const { data: invite } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invite) throw new Error("Invalid or expired token");

  // ユーザーをルームに参加させる
  const { error: joinError } = await supabase
    .from("users")
    .update({ room_id: invite.room_id })
    .eq("id", user.id);

  if (joinError) throw new Error(joinError.message);

  // トークンを使用済みにする
  const { error: usedError } = await supabase
    .from("invite_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (usedError) throw new Error(usedError.message);

  revalidatePath("/");
}
