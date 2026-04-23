import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const USERS = {
  dev: {
    email: "dev@swept.local",
    password: "DevPassword123!",
    name: "開発ユーザー",
  },
  guest: {
    email: "guest@swept.local",
    password: "GuestPassword123!",
    name: "ゲストユーザー",
  },
} as const;

async function ensureUser(
  admin: ReturnType<typeof createAdminClient>,
  role: keyof typeof USERS,
  roomId: string,
) {
  const { email, password, name } = USERS[role];
  const { data: existing } = await admin.auth.admin.listUsers();
  let user = existing?.users?.find((u) => u.email === email);

  if (!user) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    user = created.user;
  }
  if (!user) throw new Error("Failed to get user");

  const { data: existingMember } = await admin
    .from("users")
    .select("id, room_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingMember) {
    // 新規作成
    const { error } = await admin
      .from("users")
      .insert({ id: user.id, room_id: roomId, name });
    if (error) throw new Error(error.message);
  } else if (existingMember.room_id !== roomId) {
    // 既存だが別ルームにいる → 開発デモ部屋に移動
    const { error } = await admin
      .from("users")
      .update({ room_id: roomId })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  }

  return { email, password };
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { role = "dev" } = await request.json().catch(() => ({}));
  if (role !== "dev" && role !== "guest") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 共有デモ部屋を確保
  const { data: existingRoom } = await admin
    .from("rooms")
    .select("id")
    .eq("name", "開発デモ部屋")
    .maybeSingle();

  let roomId = existingRoom?.id;
  if (!roomId) {
    const { data: newRoom, error } = await admin
      .from("rooms")
      .insert({ name: "開発デモ部屋" })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    roomId = newRoom.id;
  }

  // dev / guest 両方を事前に作成しておく（同じ部屋に所属させる）
  try {
    await ensureUser(admin, "dev", roomId);
    await ensureUser(admin, "guest", roomId);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Setup failed" },
      { status: 500 },
    );
  }

  const creds = USERS[role as keyof typeof USERS];
  return NextResponse.json({ email: creds.email, password: creds.password });
}
