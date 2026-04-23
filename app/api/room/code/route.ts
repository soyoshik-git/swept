import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();

  if (!member?.room_id) return NextResponse.json({ code: null });

  const { data: room } = await supabase
    .from("rooms")
    .select("code")
    .eq("id", member.room_id)
    .single();

  return NextResponse.json({ code: room?.code ?? null });
}
