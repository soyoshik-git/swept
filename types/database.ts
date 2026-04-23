export type Room = {
  id: string;
  name: string;
  code: string | null;
  line_group_id: string | null;
  bonus_multiplier_max: number;
  created_at: string;
};

export type User = {
  id: string;
  room_id: string | null;
  name: string;
  line_user_id: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  room_id: string;
  name: string;
  space: string | null;
  base_point: number;
  frequency_days: number;
  assigned_user_id: string | null;
  is_fixed_assign: boolean;
  is_active: boolean;
  created_at: string;
};

export type Completion = {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string;
  base_point: number;
  stale_days: number;
  final_point: number | null;
  is_penalized: boolean;
};

export type NgVote = {
  id: string;
  completion_id: string;
  user_id: string;
  voted_at: string;
};

export type MonthlyStat = {
  id: string;
  room_id: string;
  user_id: string;
  year: number;
  month: number;
  total_point: number;
  penalty_pt: number;
  net_point: number;
};

export type InviteToken = {
  id: string;
  room_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
};

export type CreateTaskInput = {
  name: string;
  space?: string;
  base_point: number;
  frequency_days: number;
  assigned_user_id?: string;
  is_fixed_assign?: boolean;
};

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  is_active?: boolean;
};

export type Stats = MonthlyStat & {
  user: User;
  task_count: number;
};

export type DashboardData = {
  monthlyStats: Stats[];
  tasks: (Task & { last_completed_at: string | null; stale_days: number })[];
  recentCompletions: (Completion & { task: Task; user: User })[];
  completionCount: number;  // 自分の今月完了数
  myTotalPoint: number;     // 自分の今月獲得ポイント
  myPenaltyCount: number;   // 自分の今月ペナルティ回数
  myRank: number;           // 今月のランキング順位（0=データなし）
  overdueCount: number;
};
