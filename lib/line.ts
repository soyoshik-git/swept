import { messagingApi } from "@line/bot-sdk";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export async function pushMessage(
  groupId: string,
  text: string,
): Promise<void> {
  await client.pushMessage({
    to: groupId,
    messages: [{ type: "text", text }],
  });
}

export function buildCompletionMessage(
  userName: string,
  taskName: string,
  point: number,
): string {
  return `✅ ${userName} が「${taskName}」を完了しました！（+${point}pt）`;
}

export function buildMonthlyReportMessage(
  month: number,
  rankings: { name: string; point: number }[],
): string {
  const medals = ["🥇", "🥈", "🥉"];
  const lines = rankings
    .slice(0, 3)
    .map((r, i) => `${r.name}  ${r.point}pt ${medals[i] ?? ""}`)
    .join("\n");
  return `📊 ${month}月の清掃レポート\n\n${lines}\n\nお疲れ様でした！来月もよろしく💪`;
}
