"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserName(name: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("users")
    .update({ name: name.trim() })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function updateUserAvatar(formData: FormData): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) throw new Error("ファイルが選択されていません");
  if (file.size > 5 * 1024 * 1024) throw new Error("ファイルサイズは5MB以下にしてください");

  // ユーザーIDをファイル名にして上書きアップロード
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(user.id, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(user.id);

  // キャッシュ回避のためタイムスタンプを付与
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/settings");
  revalidatePath("/");

  return avatarUrl;
}
