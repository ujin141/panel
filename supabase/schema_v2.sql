-- PanelAI Database Schema — Extended (v2)
-- Append this to the existing schema.sql
-- OR run full script in Supabase SQL Editor

-- ─────────────────────────────────────────
-- 7. Scheduled Posts
-- ─────────────────────────────────────────
create table public.scheduled_posts (
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

create policy "Users can manage own posts" on public.scheduled_posts
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 8. Growth Alerts
-- ─────────────────────────────────────────
create table public.growth_alerts (
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

create policy "Users can manage own alerts" on public.growth_alerts
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 9. CRM Interactions
-- ─────────────────────────────────────────
create table public.crm_interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  waitlist_entry_id uuid references public.waitlist_entries(id) on delete cascade,
  type text check (type in ('dm', 'note', 'call', 'approval')) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.crm_interactions enable row level security;

create policy "Users can manage own interactions" on public.crm_interactions
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 10. Alert Thresholds (user config)
-- ─────────────────────────────────────────
create table public.alert_thresholds (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  metric text not null,
  min_value numeric,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, metric)
);

alter table public.alert_thresholds enable row level security;

create policy "Users can manage own thresholds" on public.alert_thresholds
  for all using (auth.uid() = user_id);
