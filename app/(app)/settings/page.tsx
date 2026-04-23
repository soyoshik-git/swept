import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { RoomSection } from "@/components/settings/RoomSection";
import { InviteSection } from "@/components/settings/InviteSection";
import { NotificationSection } from "@/components/settings/NotificationSection";
import { TaskSettingsSection } from "@/components/settings/TaskSettingsSection";
import { AppInfoSection } from "@/components/settings/AppInfoSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ユーザー・ルーム情報
  const { data: member } = await supabase
    .from("users")
    .select("*, room:rooms(name, code, line_group_id, bonus_multiplier_max)")
    .eq("id", user.id)
    .single();

  // メンバー一覧
  const { data: roomMembers } = await supabase
    .from("users")
    .select("id, name")
    .eq("room_id", member?.room_id ?? "");

  // 累計ポイント・完了数
  const { data: allStats } = await supabase
    .from("monthly_stats")
    .select("net_point")
    .eq("user_id", user.id);
  const totalPoint = (allStats ?? []).reduce((sum, s) => sum + (s.net_point ?? 0), 0);

  const { count: completionCount } = await supabase
    .from("completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const room = member?.room as {
    name?: string;
    code?: string;
    line_group_id?: string | null;
    bonus_multiplier_max?: number;
  } | null;
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const members = (roomMembers ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    isMe: m.id === user.id,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-foreground">設定</h1>
        <ProfileSection
          userName={member?.name ?? ""}
          avatarUrl={member?.avatar_url ?? null}
          totalPoint={totalPoint}
          completionCount={completionCount ?? 0}
        />
        <RoomSection
          roomName={room?.name ?? ""}
          members={members}
        />
        <InviteSection
          roomCode={room?.code ?? ""}
          origin={origin}
        />
        <NotificationSection lineGroupId={room?.line_group_id ?? null} />
        <TaskSettingsSection bonusMultiplierMax={room?.bonus_multiplier_max ?? 2.0} />
        <AppInfoSection />
    </div>
  );
}
