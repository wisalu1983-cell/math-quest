-- v0.3: 在线账号与数据同步系统

-- ============================================================
-- 1. 表结构
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  avatar_seed text not null default '',
  settings jsonb not null default '{"soundEnabled": true, "hapticsEnabled": true}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table game_progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  campaign_progress jsonb not null default '{}',
  advance_progress jsonb not null default '{}',
  rank_progress jsonb not null default '{"currentTier": "apprentice", "history": []}',
  wrong_questions jsonb not null default '[]',
  total_questions_attempted int not null default 0,
  total_questions_correct int not null default 0,
  updated_at timestamptz not null default now()
);

create table history_records (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  session_mode text not null,
  started_at bigint not null,
  ended_at bigint,
  completed boolean not null default false,
  result text not null,
  topic_id text not null,
  rank_match_meta jsonb,
  questions jsonb not null default '[]',
  synced_at timestamptz not null default now()
);
create index idx_history_user on history_records(user_id);

create table rank_match_sessions (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  target_tier text not null,
  best_of int not null,
  wins_to_advance int not null,
  games jsonb not null default '[]',
  status text not null default 'active',
  outcome text,
  started_at bigint not null,
  suspended_at bigint,
  cancelled_at bigint,
  ended_at bigint,
  updated_at timestamptz not null default now()
);
create index idx_rank_match_user on rank_match_sessions(user_id);

create table sync_metadata (
  user_id uuid primary key references profiles(id) on delete cascade,
  last_synced_at timestamptz not null default now(),
  device_id text
);

-- ============================================================
-- 2. Row Level Security
-- ============================================================

alter table profiles enable row level security;
create policy "用户读写自己的资料" on profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter table game_progress enable row level security;
create policy "用户读写自己的进度" on game_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table history_records enable row level security;
create policy "用户读写自己的历史" on history_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table rank_match_sessions enable row level security;
create policy "用户读写自己的段位赛" on rank_match_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table sync_metadata enable row level security;
create policy "用户读写自己的同步元数据" on sync_metadata
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 3. Triggers
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.game_progress (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.sync_metadata (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger set_updated_at before update on game_progress
  for each row execute function update_updated_at();
create trigger set_updated_at before update on rank_match_sessions
  for each row execute function update_updated_at();
