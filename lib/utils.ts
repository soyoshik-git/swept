import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Task } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

/** ポイント表示用（DB値をそのまま返す） */
export function displayPt(pt: number | null | undefined): number {
  return pt ?? 0;
}

/** 曜日配列を "月・水・金" 形式に変換 (0=日,1=月,...,6=土) */
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月〜日の順

export function formatWeekdays(weekdays: number[]): string {
  if (!weekdays.length) return "";
  return WEEKDAY_ORDER.filter((d) => weekdays.includes(d))
    .map((d) => WEEKDAY_LABELS[d])
    .join("・");
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
