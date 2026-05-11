-- base_point = 80 のタスクをアーカイブ（is_active = false に設定）
UPDATE tasks SET is_active = FALSE WHERE base_point = 80 AND is_active = TRUE;
