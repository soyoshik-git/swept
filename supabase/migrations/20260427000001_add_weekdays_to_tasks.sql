ALTER TABLE tasks ADD COLUMN IF NOT EXISTS weekdays integer[];
ALTER TABLE fixed_task_penalties ADD COLUMN IF NOT EXISTS penalty_date date;
