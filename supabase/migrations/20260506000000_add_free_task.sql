-- フリータスクフラグをタスクテーブルに追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_free_task BOOLEAN DEFAULT FALSE NOT NULL;

-- フリータスク名とメモを完了テーブルに追加
ALTER TABLE completions ADD COLUMN IF NOT EXISTS free_task_name TEXT;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 既存の全ルームにフリータスクを1件ずつ挿入
INSERT INTO tasks (room_id, name, base_point, frequency_days, is_free_task, is_active)
SELECT id, 'その他', 0, 9999, TRUE, TRUE
FROM rooms
WHERE id NOT IN (
  SELECT DISTINCT room_id FROM tasks WHERE is_free_task = TRUE
);
