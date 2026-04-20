-- ─────────────────────────────────────────────────────────────────────────────
-- PanelAI Security Hardening Migration
-- Run this in Supabase SQL Editor → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- ① waitlist: "Anyone can join waitlist" 정책 제거
-- (랜딩페이지 공개 등록이 필요한 경우만 복원)
-- 현재는 대시보드 내 관리자 전용이므로 인증 필수로 변경
drop policy if exists "Anyone can join waitlist" on public.waitlist_entries;

-- ② waitlist: INSERT도 본인만 가능하도록 명시
drop policy if exists "Users can manage own waitlist" on public.waitlist_entries;
create policy "Users can manage own waitlist" on public.waitlist_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- INSERT/UPDATE 시에도 user_id 강제

-- ③ profiles: INSERT 정책 추가 (트리거가 security definer라 괜찮지만 명시)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ④ 모든 테이블 RLS 활성화 재확인 (혹시 비활성화된 경우 대비)
alter table public.profiles              enable row level security;
alter table public.growth_metrics        enable row level security;
alter table public.content_posts         enable row level security;
alter table public.dm_templates          enable row level security;
alter table public.waitlist_entries      enable row level security;
alter table public.growth_logs           enable row level security;
alter table public.scheduled_posts       enable row level security;
alter table public.growth_alerts         enable row level security;
alter table public.crm_interactions      enable row level security;
alter table public.alert_thresholds      enable row level security;

-- ⑤ 확인용 조회 (실행 후 모든 테이블에 RLS = true 확인)
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
