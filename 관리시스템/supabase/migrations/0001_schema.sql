-- =============================================================
-- JM OS v1.0 — Database Schema
-- PostgreSQL / Supabase
-- All data is centered on the Project entity.
-- =============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- =============================================================
-- ENUM TYPES
-- =============================================================

-- 사용자 역할: 대표 / 이사 / 디자인팀 / 현장팀 / 경리팀
create type user_role as enum (
  'representative',  -- 대표
  'director',        -- 이사
  'design',          -- 디자인팀
  'field',           -- 현장팀
  'accounting'       -- 경리팀
);

-- 프로젝트 상태
create type project_status as enum (
  'inquiry',       -- 문의 접수
  'survey',        -- 현장 실측
  'design',        -- 디자인 진행
  'estimate',      -- 견적 진행
  'contract',      -- 계약 완료
  'construction',  -- 시공 진행
  'completed'      -- 마감 완료
);

-- 공정 카테고리
create type task_category as enum (
  'demolition',  -- 철거
  'carpentry',   -- 목공
  'electrical',  -- 전기
  'plumbing',    -- 설비
  'tile',        -- 타일
  'painting',    -- 도장
  'film',        -- 필름
  'furniture',   -- 가구
  'cleaning'     -- 청소
);

-- 공정 상태
create type task_status as enum (
  'pending',      -- 예정
  'in_progress',  -- 진행중
  'completed',    -- 완료
  'delayed'       -- 지연
);

-- 출금 요청 상태
create type payment_status as enum (
  'requested',         -- 요청
  'pending_approval',  -- 승인 대기
  'approved',          -- 승인 완료
  'paid',              -- 지급 완료
  'rejected'           -- 반려
);

-- 파일 카테고리 (저장 폴더와 1:1 매핑)
create type file_category as enum (
  'before',   -- 시공 전 사진
  'after',    -- 시공 후 사진
  'cad',      -- 도면
  'render',   -- 3D 렌더
  'meeting',  -- 미팅 자료
  'receipt',  -- 영수증
  'doc'       -- 일반 문서
);

create type storage_provider as enum (
  'supabase',
  'cloudflare_r2'
);

-- 매뉴얼 카테고리
create type manual_category as enum (
  'company',       -- 회사 공지
  'design',        -- 디자인팀
  'construction'   -- 시공팀
);

-- =============================================================
-- TABLES
-- =============================================================

-- ---------- users ----------
-- public.users.id == auth.users.id (1:1). Supabase Auth가 인증을 담당하고
-- 이 테이블은 역할/프로필 정보를 보관한다.
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'field',
  name        text        not null,
  phone       text,
  email       text        not null,
  department  text,
  hire_date   date,
  leave_date  date,
  created_at  timestamptz not null default now()
);

-- ---------- customers ----------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text,
  address     text,
  memo        text,
  created_at  timestamptz not null default now()
);

-- ---------- projects ----------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references public.customers(id) on delete set null,
  name             text not null,
  address          text,
  status           project_status not null default 'inquiry',
  manager_id       uuid references public.users(id) on delete set null,
  contract_amount  numeric(14,0),
  start_date       date,
  end_date         date,
  description       text,
  created_at       timestamptz not null default now()
);
create index idx_projects_status      on public.projects(status);
create index idx_projects_manager     on public.projects(manager_id);
create index idx_projects_customer    on public.projects(customer_id);

-- ---------- tasks (공정) ----------
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  category          task_category not null,
  title             text not null,
  assigned_user_id  uuid references public.users(id) on delete set null,
  scheduled_date    date,
  completed_date    date,
  status            task_status not null default 'pending',
  created_at        timestamptz not null default now()
);
create index idx_tasks_project   on public.tasks(project_id);
create index idx_tasks_assignee  on public.tasks(assigned_user_id);
create index idx_tasks_schedule  on public.tasks(scheduled_date);

-- ---------- meeting_notes (미팅 기록) ----------
create table public.meeting_notes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  author_id   uuid references public.users(id) on delete set null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create index idx_meeting_notes_project on public.meeting_notes(project_id);

-- ---------- files ----------
create table public.files (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  category          file_category not null,
  file_name         text not null,
  file_type         text,
  storage_provider  storage_provider not null default 'supabase',
  storage_path      text not null,
  public_url        text,
  uploaded_by       uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index idx_files_project on public.files(project_id);
create index idx_files_category on public.files(project_id, category);

-- ---------- receipts (영수증) ----------
create table public.receipts (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  amount      numeric(14,0) not null,
  purpose     text,
  image_url   text,
  created_at  timestamptz not null default now()
);
create index idx_receipts_project on public.receipts(project_id);

-- ---------- payment_requests (출금 요청) ----------
create table public.payment_requests (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  requester_id  uuid references public.users(id) on delete set null,
  vendor_name   text,
  amount        numeric(14,0) not null,
  description   text,
  due_date      date,
  status        payment_status not null default 'requested',
  approved_by   uuid references public.users(id) on delete set null,
  approved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index idx_payment_requests_project on public.payment_requests(project_id);
create index idx_payment_requests_status  on public.payment_requests(status);

-- ---------- manuals (매뉴얼) ----------
create table public.manuals (
  id          uuid primary key default gen_random_uuid(),
  category    manual_category not null,
  title       text not null,
  content     text,
  created_at  timestamptz not null default now()
);

-- ---------- notices (공지사항) ----------
create table public.notices (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  author_id   uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- audit_logs (감사 로그) ----------
-- 비기능 요구사항: 감사 로그 저장
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  action      text not null,            -- e.g. 'project.update', 'payment.approve'
  entity      text not null,            -- table name
  entity_id   uuid,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_logs_entity on public.audit_logs(entity, entity_id);
create index idx_audit_logs_actor  on public.audit_logs(actor_id);
