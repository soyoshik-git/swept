import type { Task } from "@/types/database";

/** 放置日数からタスクの色分けを返す */
export function getStaleBadgeVariant(
  staleDays: number,
  frequencyDays: number,
): "red" | "yellow" | "green" {
  if (staleDays >= frequencyDays * 2) return "red";
  if (staleDays >= frequencyDays) return "yellow";
  return "green";
}

/** 放置日数ラベル */
export function formatStaleDays(staleDays: number): string {
  if (staleDays === 999) return "未完了";
  if (staleDays === 0) return "今日完了";
  return `${staleDays}日放置`;
}

/** 日時フォーマット */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
