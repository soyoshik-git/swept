import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

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
  const events: Array<{ type: string; source: { groupId?: string; roomId?: string } }> =
    body.events ?? [];

  const supabase = await createClient();

  for (const event of events) {
    if (event.type === "join") {
      const groupId = event.source.groupId ?? event.source.roomId;
      if (groupId) {
        // line_group_idが未設定のルームに割り当てる（最初のルームに紐付け）
        await supabase
          .from("rooms")
          .update({ line_group_id: groupId })
          .is("line_group_id", null)
          .limit(1);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
