-- PanelAI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. Profiles (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 2. Growth Metrics (daily tracking)
-- ─────────────────────────────────────────
create table public.growth_metrics (
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

create policy "Users can manage own metrics" on public.growth_metrics
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 3. Content Posts (AI-generated)
-- ─────────────────────────────────────────
create table public.content_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  platform text check (platform in ('threads', 'instagram')) not null,
  type text check (type in ('curiosity', 'emotion', 'scarcity')) not null,
  target text,
  content text not null,
  is_saved boolean default false,
  created_at timestamptz default now()
);

alter table public.content_posts enable row level security;

create policy "Users can manage own content" on public.content_posts
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 4. DM Templates
-- ─────────────────────────────────────────
create table public.dm_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  stage text check (stage in ('first_response', 'filter', 'waitlist')) not null,
  script text not null,
  created_at timestamptz default now()
);

alter table public.dm_templates enable row level security;

create policy "Users can manage own templates" on public.dm_templates
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 5. Waitlist Entries
-- ─────────────────────────────────────────
create table public.waitlist_entries (
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

create policy "Users can manage own waitlist" on public.waitlist_entries
  for all using (auth.uid() = user_id);

-- Public insert for landing page form
create policy "Anyone can join waitlist" on public.waitlist_entries
  for insert with check (true);

-- ─────────────────────────────────────────
-- 6. Growth Logs (Case Study)
-- ─────────────────────────────────────────
create table public.growth_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  day_number int not null,
  title text not null,
  description text,
  metrics jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.growth_logs enable row level security;

create policy "Users can manage own growth logs" on public.growth_logs
  for all using (auth.uid() = user_id);
