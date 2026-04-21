import { describe, expect, it } from "vitest";
import {
  calcFinalPoint,
  calcPenalty,
  calcStaleMultiplier,
  isEndOfMonth,
} from "./points";

describe("calcStaleMultiplier", () => {
  it("放置日数が推奨頻度未満なら1.0", () => {
    expect(calcStaleMultiplier(3, 7)).toBe(1.0);
    expect(calcStaleMultiplier(0, 7)).toBe(1.0);
    expect(calcStaleMultiplier(6, 7)).toBe(1.0);
  });

  it("放置日数が推奨頻度以上2倍未満なら1.0", () => {
    expect(calcStaleMultiplier(7, 7)).toBe(1.0);
    expect(calcStaleMultiplier(13, 7)).toBe(1.0);
  });

  it("放置日数が推奨頻度の2倍以上3倍未満なら1.5", () => {
    expect(calcStaleMultiplier(14, 7)).toBe(1.5);
    expect(calcStaleMultiplier(20, 7)).toBe(1.5);
  });

  it("放置日数が推奨頻度の3倍以上なら2.0", () => {
    expect(calcStaleMultiplier(21, 7)).toBe(2.0);
    expect(calcStaleMultiplier(100, 7)).toBe(2.0);
  });

  it("推奨頻度が1日の場合", () => {
    expect(calcStaleMultiplier(0, 1)).toBe(1.0);
    expect(calcStaleMultiplier(1, 1)).toBe(1.0);
    expect(calcStaleMultiplier(2, 1)).toBe(1.5);
    expect(calcStaleMultiplier(3, 1)).toBe(2.0);
  });
});

describe("calcFinalPoint", () => {
  it("NGなし・放置なしの基本ケース", () => {
    expect(calcFinalPoint(100, 3, 7, 0, 4)).toBe(100);
  });

  it("放置ボーナス1.5倍が適用される", () => {
    expect(calcFinalPoint(100, 14, 7, 0, 4)).toBe(150);
  });

  it("放置ボーナス2.0倍が適用される", () => {
    expect(calcFinalPoint(100, 21, 7, 0, 4)).toBe(200);
  });

  it("NG1票（4人中）でペナルティ25%", () => {
    // 100 * 1.0 * (1 - 1/4) = 75
    expect(calcFinalPoint(100, 3, 7, 1, 4)).toBe(75);
  });

  it("NG2票（4人中）でペナルティ50%", () => {
    // 100 * 1.0 * (1 - 2/4) = 50
    expect(calcFinalPoint(100, 3, 7, 2, 4)).toBe(50);
  });

  it("NG全員でポイント0", () => {
    expect(calcFinalPoint(100, 3, 7, 4, 4)).toBe(0);
  });

  it("放置ボーナスとNG減算の組み合わせ", () => {
    // 100 * 1.5 * (1 - 1/4) = 112.5 → floor → 112
    expect(calcFinalPoint(100, 14, 7, 1, 4)).toBe(112);
  });

  it("端数はfloorで切り捨てる", () => {
    // 10 * 1.0 * (1 - 1/3) = 6.666... → floor → 6
    expect(calcFinalPoint(10, 1, 7, 1, 3)).toBe(6);
  });

  it("メンバー数0の場合はNGペナルティなし", () => {
    expect(calcFinalPoint(100, 3, 7, 0, 0)).toBe(100);
  });
});

describe("calcPenalty", () => {
  it("base_pointの50%をマイナスで返す", () => {
    expect(calcPenalty(100)).toBe(-50);
    expect(calcPenalty(200)).toBe(-100);
  });

  it("端数はfloorで切り捨て（符号に注意）", () => {
    // floor(50 * 0.5) = 25 → -25
    expect(calcPenalty(50)).toBe(-25);
    // floor(11 * 0.5) = floor(5.5) = 5 → -5
    expect(calcPenalty(11)).toBe(-5);
  });

  it("base_pointが0の場合は0", () => {
    expect(calcPenalty(0)).toBe(0);
  });
});

describe("isEndOfMonth", () => {
  it("月末の日付はtrueを返す", () => {
    expect(isEndOfMonth(new Date(2024, 0, 31))).toBe(true);  // 1月31日
    expect(isEndOfMonth(new Date(2024, 2, 31))).toBe(true);  // 3月31日
    expect(isEndOfMonth(new Date(2024, 3, 30))).toBe(true);  // 4月30日
    expect(isEndOfMonth(new Date(2024, 11, 31))).toBe(true); // 12月31日
  });

  it("月末でない日付はfalseを返す", () => {
    expect(isEndOfMonth(new Date(2024, 0, 30))).toBe(false); // 1月30日
    expect(isEndOfMonth(new Date(2024, 2, 30))).toBe(false); // 3月30日
    expect(isEndOfMonth(new Date(2024, 3, 29))).toBe(false); // 4月29日
  });

  it("うるう年の2月29日はtrueを返す", () => {
    expect(isEndOfMonth(new Date(2024, 1, 29))).toBe(true);
  });

  it("平年の2月28日はtrueを返す", () => {
    expect(isEndOfMonth(new Date(2023, 1, 28))).toBe(true);
  });

  it("うるう年の2月28日はfalseを返す", () => {
    expect(isEndOfMonth(new Date(2024, 1, 28))).toBe(false);
  });
});
