import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushMessage } from "@/lib/line";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const events: Array<{
    type: string;
    source: { groupId?: string; roomId?: string };
    message?: { type: string; text: string };
  }> = body.events ?? [];

  const supabase = createAdminClient();

  for (const event of events) {
    const groupId = event.source.groupId ?? event.source.roomId;
    if (!groupId) continue;

    // ボットがグループに参加 → line_group_id が未設定のルームに割り当て
    if (event.type === "join") {
      await supabase
        .from("rooms")
        .update({ line_group_id: groupId })
        .is("line_group_id", null)
        .limit(1);
    }

    // ボットがグループから退出 → そのグループIDのルームを解除
    if (event.type === "leave") {
      await supabase
        .from("rooms")
        .update({ line_group_id: null })
        .eq("line_group_id", groupId);
    }

    // 「連携」コマンド → このグループをルームに紐付け（グループ変更時に使用）
    if (
      event.type === "message" &&
      event.message?.type === "text" &&
      event.message.text.trim() === "連携"
    ) {
      // 既にこのグループに連携済みなら何もしない
      const { data: already } = await supabase
        .from("rooms")
        .select("id")
        .eq("line_group_id", groupId)
        .maybeSingle();

      if (!already) {
        // 未設定のルームを優先、なければ最初のルームを上書き
        const { data: target } = await supabase
          .from("rooms")
          .select("id")
          .is("line_group_id", null)
          .limit(1)
          .maybeSingle();

        const targetId = target?.id ?? (await supabase
          .from("rooms")
          .select("id")
          .order("created_at")
          .limit(1)
          .maybeSingle()
        ).data?.id;

        if (targetId) {
          await supabase
            .from("rooms")
            .update({ line_group_id: groupId })
            .eq("id", targetId);

          await pushMessage(groupId, "✅ このグループとSweptを連携しました！タスク完了通知がここに届きます。");
        }
      } else {
        await pushMessage(groupId, "ℹ️ このグループはすでに連携済みです。");
      }
    }
  }

  return NextResponse.json({ ok: true });
}
