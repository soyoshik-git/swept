import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 表示しないメールアドレスのパターン（開発用アカウント）
const DEV_EMAIL_PATTERNS = ["@swept.local", "@demo.test"];

/** ルーム内の本番メンバーを返す（ログイン画面用） */
export async function GET() {
  const admin = createAdminClient();

  // auth.users から開発用メールを除いたユーザーIDを取得
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const realUserIds = new Set(
    (authUsers?.users ?? [])
      .filter((u) => !DEV_EMAIL_PATTERNS.some((p) => u.email?.includes(p)))
      .map((u) => u.id)
  );

  const { data: users, error } = await admin
    .from("users")
    .select("id, name, avatar_url")
    .in("id", [...realUserIds])
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(users ?? []);
}

/**
 * 指定ユーザーのOTPトークンを生成して返す
 * クライアントは verifyOtp を呼ぶだけで即ログイン完了（リダイレクト不要）
 */
export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const admin = createAdminClient();

  // auth.users から email を取得
  const { data: authUser, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !authUser.user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // OTPトークンを発行（メール送信なし）
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.user.email,
    options: { redirectTo: `${req.nextUrl.origin}/auth/callback` },
  });

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message ?? "Failed to generate token" }, { status: 500 });
  }

  // hashed_token をクライアントに返す → verifyOtp で直接ログイン
  return NextResponse.json({ hashedToken: data.properties.hashed_token });
}
