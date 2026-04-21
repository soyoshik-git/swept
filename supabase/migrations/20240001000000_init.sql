-- ルーム
create table rooms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  line_group_id text,
  created_at    timestamptz default now()
);

-- ユーザー（Supabase Authと紐づく）
create table users (
  id           uuid primary key references auth.users(id),
  room_id      uuid references rooms(id),
  name         text not null,
  line_user_id text,
  created_at   timestamptz default now()
);

-- タスク
create table tasks (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid references rooms(id),
  name             text not null,
  space            text,
  base_point       int not null,
  frequency_days   int not null,
  assigned_user_id uuid references users(id),
  is_fixed_assign  boolean default false,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- 完了ログ
create table completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references tasks(id),
  user_id      uuid references users(id),
  completed_at timestamptz default now(),
  base_point   int not null,
  stale_days   int not null,
  final_point  int,
  is_penalized boolean default false
);

-- NGレビュー
create table ng_votes (
  id            uuid primary key default gen_random_uuid(),
  completion_id uuid references completions(id),
  user_id       uuid references users(id),
  voted_at      timestamptz default now(),
  unique(completion_id, user_id)
);

-- 月次集計
create table monthly_stats (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references rooms(id),
  user_id     uuid references users(id),
  year        int not null,
  month       int not null,
  total_point int not null default 0,
  penalty_pt  int not null default 0,
  net_point   int not null default 0,
  unique(room_id, user_id, year, month)
);

-- 招待トークン
create table invite_tokens (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id),
  token      text unique not null,
  expires_at timestamptz not null,
  used_at    timestamptz
);

-- RLS有効化
alter table rooms         enable row level security;
alter table users         enable row level security;
alter table tasks         enable row level security;
alter table completions   enable row level security;
alter table ng_votes      enable row level security;
alter table monthly_stats enable row level security;
alter table invite_tokens enable row level security;

-- RLSポリシー: 自分のroom_idのデータのみ操作可能

-- rooms: 自分が所属するルームのみ参照可
create policy "rooms: member can select"
  on rooms for select
  using (id in (select room_id from users where id = auth.uid()));

-- users: 同じルームのメンバーのみ参照可
create policy "users: same room can select"
  on users for select
  using (room_id in (select room_id from users where id = auth.uid()));

create policy "users: can update own record"
  on users for update
  using (id = auth.uid());

create policy "users: can insert own record"
  on users for insert
  with check (id = auth.uid());

-- tasks: 同じルームのタスクのみ操作可
create policy "tasks: same room can select"
  on tasks for select
  using (room_id in (select room_id from users where id = auth.uid()));

create policy "tasks: same room can insert"
  on tasks for insert
  with check (room_id in (select room_id from users where id = auth.uid()));

create policy "tasks: same room can update"
  on tasks for update
  using (room_id in (select room_id from users where id = auth.uid()));

-- completions: 同じルームのタスクに紐づく完了ログのみ操作可
create policy "completions: same room can select"
  on completions for select
  using (task_id in (
    select id from tasks where room_id in (
      select room_id from users where id = auth.uid()
    )
  ));

create policy "completions: same room can insert"
  on completions for insert
  with check (task_id in (
    select id from tasks where room_id in (
      select room_id from users where id = auth.uid()
    )
  ));

create policy "completions: same room can update"
  on completions for update
  using (task_id in (
    select id from tasks where room_id in (
      select room_id from users where id = auth.uid()
    )
  ));

-- ng_votes: 同じルームの完了ログに紐づくNGレビューのみ操作可
create policy "ng_votes: same room can select"
  on ng_votes for select
  using (completion_id in (
    select c.id from completions c
    join tasks t on c.task_id = t.id
    where t.room_id in (select room_id from users where id = auth.uid())
  ));

create policy "ng_votes: same room can insert"
  on ng_votes for insert
  with check (completion_id in (
    select c.id from completions c
    join tasks t on c.task_id = t.id
    where t.room_id in (select room_id from users where id = auth.uid())
  ));

-- monthly_stats: 同じルームのみ参照可
create policy "monthly_stats: same room can select"
  on monthly_stats for select
  using (room_id in (select room_id from users where id = auth.uid()));

-- invite_tokens: 有効なトークンは未認証でも参照可（招待リンク用）
create policy "invite_tokens: anyone can select valid token"
  on invite_tokens for select
  using (used_at is null and expires_at > now());

create policy "invite_tokens: room member can insert"
  on invite_tokens for insert
  with check (room_id in (select room_id from users where id = auth.uid()));

create policy "invite_tokens: room member can update"
  on invite_tokens for update
  using (room_id in (select room_id from users where id = auth.uid()));
