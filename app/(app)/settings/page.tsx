import { createClient } from "@/lib/supabase/server";
import { createInviteToken } from "@/actions/rooms";
import { Card, CardHeader } from "@/components/ui/Card";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("users")
    .select("*, room:rooms(name)")
    .eq("id", user!.id)
    .single();

  const { data: roomMembers } = await supabase
    .from("users")
    .select("id, name")
    .eq("room_id", member?.room_id ?? "");

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  async function handleCreateInvite() {
    "use server";
    const token = await createInviteToken();
    redirect(`/settings?invited=${token}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">設定</h1>

      {/* ルーム情報 */}
      <Card>
        <CardHeader title="ルーム" />
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400">ルーム名</p>
            <p className="text-sm font-medium text-gray-900">
              {member?.room?.name ?? "未設定"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">メンバー</p>
            <ul className="space-y-1">
              {(roomMembers ?? []).map((m) => (
                <li key={m.id} className="text-sm text-gray-700">
                  {m.name}
                  {m.id === user!.id && (
                    <span className="ml-1 text-xs text-gray-400">（あなた）</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <form action={handleCreateInvite}>
            <button
              type="submit"
              className="w-full rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              招待リンクを生成
            </button>
          </form>
        </div>
      </Card>

      {/* アカウント */}
      <Card>
        <CardHeader title="アカウント" />
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400">メールアドレス</p>
            <p className="text-sm text-gray-700">{user!.email}</p>
          </div>
          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
