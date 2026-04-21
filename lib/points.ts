/**
 * 放置ボーナス倍率を計算する
 * staleDays < frequencyDays       → 1.0
 * staleDays >= frequencyDays * 2  → 1.5
 * staleDays >= frequencyDays * 3  → 2.0
 */
export function calcStaleMultiplier(staleDays: number, frequencyDays: number): number {
  if (staleDays >= frequencyDays * 3) return 2.0;
  if (staleDays >= frequencyDays * 2) return 1.5;
  return 1.0;
}

/**
 * 完了時の獲得ポイントを計算する
 * final_point = floor(base_point × stale_multiplier × (1 - ng_count / total_members))
 */
export function calcFinalPoint(
  basePoint: number,
  staleDays: number,
  frequencyDays: number,
  ngCount: number,
  totalMembers: number,
): number {
  const multiplier = calcStaleMultiplier(staleDays, frequencyDays);
  const ngPenalty = totalMembers > 0 ? ngCount / totalMembers : 0;
  return Math.floor(basePoint * multiplier * (1 - ngPenalty));
}

/**
 * 固定担当タスクのペナルティを計算する
 * -floor(base_point × 0.5)
 */
export function calcPenalty(basePoint: number): number {
  return -Math.floor(basePoint * 0.5) || 0;
}

/**
 * 指定した日付が月末かどうか判定する（うるう年対応）
 */
export function isEndOfMonth(date: Date): boolean {
  const next = new Date(date);
  next.setDate(date.getDate() + 1);
  return next.getMonth() !== date.getMonth();
}
