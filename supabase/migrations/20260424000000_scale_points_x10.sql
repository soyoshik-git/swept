-- base_point の単位を 1-8 から 10-80 に変更（×10スケールアップ）
-- displayPt() の ×10 変換を廃止し、DB値をそのまま表示する形式に移行

-- tasks テーブル
UPDATE tasks SET base_point = base_point * 10 WHERE base_point <= 8;

-- completions テーブル
UPDATE completions SET final_point = final_point * 10 WHERE final_point <= 80;

-- monthly_stats テーブル
UPDATE monthly_stats SET
  total_point = total_point * 10,
  penalty_pt  = penalty_pt  * 10;
