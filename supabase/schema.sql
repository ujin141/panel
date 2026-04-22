-- PanelAI Unified Database Schema
-- Run this entirely in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. Profiles (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 덮어쓰기 (중복 에러 방지)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. Growth Metrics (daily tracking)
-- ─────────────────────────────────────────
create table if not exists public.growth_metrics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  views int default 0,
  dms int default 0,
  waitlist_count int default 0,
  installs int default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.growth_metrics enable row level security;

drop policy if exists "Users can manage own metrics" on public.growth_metrics;
create policy "Users can manage own metrics" on public.growth_metrics
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 3. Content Posts (AI-generated)
-- ─────────────────────────────────────────
create table if not exists public.content_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  platform text check (platform in ('threads', 'instagram')) not null,
  type text check (type in ('curiosity', 'emotion', 'scarcity')) not null,
  target text,
  content text not null,
  is_saved boolean default false,
  views int default 0,
  dms int default 0,
  comments int default 0,
  created_at timestamptz default now()
);

-- 기존 테이블이 있을 경우를 대비하여 컬럼 강제 추가 (에러 무시됨)
alter table public.content_posts 
  add column if not exists views int default 0,
  add column if not exists dms int default 0,
  add column if not exists comments int default 0;

alter table public.content_posts enable row level security;

drop policy if exists "Users can manage own content" on public.content_posts;
create policy "Users can manage own content" on public.content_posts
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 4. DM Templates
-- ─────────────────────────────────────────
create table if not exists public.dm_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  stage text check (stage in ('first_response', 'filter', 'waitlist')) not null,
  script text not null,
  created_at timestamptz default now()
);

alter table public.dm_templates enable row level security;

drop policy if exists "Users can manage own templates" on public.dm_templates;
create policy "Users can manage own templates" on public.dm_templates
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 5. Waitlist Entries
-- ─────────────────────────────────────────
create table if not exists public.waitlist_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  instagram_id text,
  gender text check (gender in ('female', 'male', 'other', 'prefer_not')),
  interests text[] default '{}',
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

alter table public.waitlist_entries enable row level security;

-- 기존 랜딩페이지 전체 허용 정책 삭제 (보안 강화)
drop policy if exists "Anyone can join waitlist" on public.waitlist_entries;
drop policy if exists "Users can manage own waitlist" on public.waitlist_entries;

create policy "Users can manage own waitlist" on public.waitlist_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 6. Growth Logs (Case Study)
-- ─────────────────────────────────────────
create table if not exists public.growth_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  day_number int not null,
  title text not null,
  description text,
  metrics jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.growth_logs enable row level security;

drop policy if exists "Users can manage own growth logs" on public.growth_logs;
create policy "Users can manage own growth logs" on public.growth_logs
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 7. Scheduled Posts (v2)
-- ─────────────────────────────────────────
create table if not exists public.scheduled_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  platform text check (platform in ('threads', 'instagram')) not null,
  content text not null,
  content_type text default 'curiosity',
  scheduled_at timestamptz,
  status text check (status in ('draft', 'scheduled', 'published', 'failed')) default 'draft',
  published_at timestamptz,
  created_at timestamptz default now()
);

alter table public.scheduled_posts enable row level security;

drop policy if exists "Users can manage own posts" on public.scheduled_posts;
create policy "Users can manage own posts" on public.scheduled_posts
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 8. Growth Alerts (v2)
-- ─────────────────────────────────────────
create table if not exists public.growth_alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  severity text check (severity in ('critical', 'warning', 'info')) default 'info',
  status text check (status in ('active', 'resolved', 'snoozed')) default 'active',
  metric text,
  threshold numeric,
  current_value numeric,
  action_suggestion text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

alter table public.growth_alerts enable row level security;

drop policy if exists "Users can manage own alerts" on public.growth_alerts;
create policy "Users can manage own alerts" on public.growth_alerts
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 9. CRM Interactions (v2)
-- ─────────────────────────────────────────
create table if not exists public.crm_interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  waitlist_entry_id uuid references public.waitlist_entries(id) on delete cascade,
  type text check (type in ('dm', 'note', 'call', 'approval')) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.crm_interactions enable row level security;

drop policy if exists "Users can manage own interactions" on public.crm_interactions;
create policy "Users can manage own interactions" on public.crm_interactions
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 10. Alert Thresholds (v2)
-- ─────────────────────────────────────────
create table if not exists public.alert_thresholds (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  metric text not null,
  min_value numeric,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, metric)
);

alter table public.alert_thresholds enable row level security;

drop policy if exists "Users can manage own thresholds" on public.alert_thresholds;
create policy "Users can manage own thresholds" on public.alert_thresholds
  for all using (auth.uid() = user_id);
