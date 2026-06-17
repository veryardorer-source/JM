-- =============================================================
-- JM OS v1.0 — Row Level Security & Role-based Access
-- =============================================================
-- Supabase는 로그인 사용자를 모두 단일 `authenticated` 역할로 처리하므로,
-- 역할 구분은 Postgres GRANT가 아니라 RLS USING 식과 헬퍼 함수로 한다.
-- 컬럼 단위 민감정보(재무/연락처/개인정보)는 security_invoker 뷰에서 마스킹한다.
-- =============================================================

-- ---------- 헬퍼 함수 ----------
-- security definer 로 작성해 users RLS와의 무한 재귀를 피한다.
create or replace function public.auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('representative', 'director')
  );
$$;

-- 재무 처리 권한 (대표/이사/경리)
create or replace function public.can_finance()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('representative', 'director', 'accounting')
  );
$$;

-- 프로젝트/고객 편집 권한 (대표/이사/디자인)
create or replace function public.can_manage_project()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('representative', 'director', 'design')
  );
$$;

-- 로그인한 직원인지
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid());
$$;

-- =============================================================
-- ENABLE RLS
-- =============================================================
alter table public.users            enable row level security;
alter table public.customers        enable row level security;
alter table public.projects         enable row level security;
alter table public.tasks            enable row level security;
alter table public.meeting_notes    enable row level security;
alter table public.files            enable row level security;
alter table public.receipts         enable row level security;
alter table public.payment_requests enable row level security;
alter table public.manuals          enable row level security;
alter table public.notices          enable row level security;
alter table public.audit_logs       enable row level security;

-- =============================================================
-- USERS  — 본인 또는 관리자만 조회. 쓰기는 관리자.
-- =============================================================
create policy users_select on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy users_insert on public.users
  for insert with check (public.is_admin());
create policy users_update on public.users
  for update using (public.is_admin()) with check (public.is_admin());
create policy users_delete on public.users
  for delete using (public.is_admin());

-- =============================================================
-- CUSTOMERS — 직원은 행 조회 가능, 연락처는 뷰에서 마스킹.
--             편집은 프로젝트 관리 권한자.
-- =============================================================
create policy customers_select on public.customers
  for select using (public.is_staff());
create policy customers_write on public.customers
  for all using (public.can_manage_project()) with check (public.can_manage_project());

-- =============================================================
-- PROJECTS — 직원 전체 조회. 계약금액은 뷰에서 마스킹.
--            편집은 프로젝트 관리 권한자.
-- =============================================================
create policy projects_select on public.projects
  for select using (public.is_staff());
create policy projects_write on public.projects
  for all using (public.can_manage_project()) with check (public.can_manage_project());

-- =============================================================
-- TASKS — 직원 전체 조회/등록. 현장팀이 상태를 갱신할 수 있도록 허용.
-- =============================================================
create policy tasks_select on public.tasks
  for select using (public.is_staff());
create policy tasks_insert on public.tasks
  for insert with check (public.is_staff());
create policy tasks_update on public.tasks
  for update using (public.is_staff()) with check (public.is_staff());
create policy tasks_delete on public.tasks
  for delete using (public.can_manage_project());

-- =============================================================
-- MEETING NOTES — 직원 조회/작성. 수정/삭제는 작성자 또는 관리자.
-- =============================================================
create policy meeting_notes_select on public.meeting_notes
  for select using (public.is_staff());
create policy meeting_notes_insert on public.meeting_notes
  for insert with check (author_id = auth.uid());
create policy meeting_notes_update on public.meeting_notes
  for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
create policy meeting_notes_delete on public.meeting_notes
  for delete using (author_id = auth.uid() or public.is_admin());

-- =============================================================
-- FILES — 직원 조회/업로드. 삭제는 업로더 또는 관리자.
-- =============================================================
create policy files_select on public.files
  for select using (public.is_staff());
create policy files_insert on public.files
  for insert with check (uploaded_by = auth.uid());
create policy files_delete on public.files
  for delete using (uploaded_by = auth.uid() or public.is_admin());

-- =============================================================
-- RECEIPTS — 본인 영수증 또는 재무권한자 조회. 등록은 직원 본인.
-- =============================================================
create policy receipts_select on public.receipts
  for select using (user_id = auth.uid() or public.can_finance());
create policy receipts_insert on public.receipts
  for insert with check (user_id = auth.uid());
create policy receipts_update on public.receipts
  for update using (user_id = auth.uid() or public.can_finance())
  with check (user_id = auth.uid() or public.can_finance());
create policy receipts_delete on public.receipts
  for delete using (user_id = auth.uid() or public.is_admin());

-- =============================================================
-- PAYMENT REQUESTS — 요청자 본인 또는 재무권한자 조회.
--   등록: 직원 본인.  승인/지급 상태 변경: 재무권한자.
-- =============================================================
create policy payment_select on public.payment_requests
  for select using (requester_id = auth.uid() or public.can_finance());
create policy payment_insert on public.payment_requests
  for insert with check (requester_id = auth.uid());
-- 요청자는 '요청' 상태에서만 자기 요청 수정 가능
create policy payment_update_owner on public.payment_requests
  for update using (requester_id = auth.uid() and status = 'requested')
  with check (requester_id = auth.uid());
-- 재무권한자는 승인/반려/지급 처리 가능
create policy payment_update_finance on public.payment_requests
  for update using (public.can_finance()) with check (public.can_finance());
create policy payment_delete on public.payment_requests
  for delete using (requester_id = auth.uid() or public.is_admin());

-- =============================================================
-- MANUALS / NOTICES — 직원 조회. 작성/수정은 관리자.
-- =============================================================
create policy manuals_select on public.manuals
  for select using (public.is_staff());
create policy manuals_write on public.manuals
  for all using (public.is_admin()) with check (public.is_admin());

create policy notices_select on public.notices
  for select using (public.is_staff());
create policy notices_write on public.notices
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================
-- AUDIT LOGS — 관리자만 조회. 등록은 모든 직원(앱 기록용).
-- =============================================================
create policy audit_select on public.audit_logs
  for select using (public.is_admin());
create policy audit_insert on public.audit_logs
  for insert with check (actor_id = auth.uid());

-- =============================================================
-- 컬럼 마스킹 뷰 (security_invoker = base table RLS 그대로 적용)
-- 앱의 읽기는 가능하면 아래 뷰를 사용한다.
-- =============================================================

-- 프로젝트: 계약금액은 관리자에게만 노출
create or replace view public.projects_v
with (security_invoker = true) as
select
  p.id, p.customer_id, p.name, p.address, p.status, p.manager_id,
  case when public.is_admin() then p.contract_amount else null end as contract_amount,
  p.start_date, p.end_date, p.description, p.created_at
from public.projects p;

-- 고객: 연락처(전화/이메일)는 현장팀에게 마스킹
create or replace view public.customers_v
with (security_invoker = true) as
select
  c.id, c.name, c.address, c.memo, c.created_at,
  case when public.auth_role() <> 'field' then c.phone else null end as phone,
  case when public.auth_role() <> 'field' then c.email else null end as email
from public.customers c;

-- 직원 디렉터리: 개인정보(전화/이메일/입퇴사일)는 관리자/본인에게만
create or replace view public.users_v
with (security_invoker = true) as
select
  u.id, u.name, u.role, u.department,
  case when public.is_admin() or u.id = auth.uid() then u.phone      else null end as phone,
  case when public.is_admin() or u.id = auth.uid() then u.email      else null end as email,
  case when public.is_admin() or u.id = auth.uid() then u.hire_date  else null end as hire_date,
  case when public.is_admin() or u.id = auth.uid() then u.leave_date else null end as leave_date,
  u.created_at
from public.users u;

grant select on public.projects_v, public.customers_v, public.users_v to authenticated;

-- =============================================================
-- 신규 가입자 자동 프로필 생성 트리거
-- auth.users 에 사용자가 생기면 public.users 에 기본 프로필 추가
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
