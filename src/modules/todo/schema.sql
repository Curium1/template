-- ============================================
-- Todo module schema
-- Module: todo
-- Tables: todo_tasks
-- ============================================

create table if not exists public.todo_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Content
  title text not null,
  description text,
  icon text default 'check-square',

  -- Source module (nullable = manually created task)
  module_key text,
  module_label text,
  module_label_key text,
  source_path text not null default '/todo',

  -- Status & lifecycle
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  is_read boolean not null default false,
  is_muted boolean not null default false,

  -- Dates
  deadline timestamptz,
  completed_at timestamptz,

  -- Recurrence (stored as JSONB, nullable = one-off task)
  recurrence jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.todo_tasks enable row level security;

-- RLS: users see their own tasks within their companies
create policy "todo_select" on todo_tasks for select
  using (
    user_id = auth.uid()
    and company_id in (select public.get_my_company_ids())
  );

create policy "todo_insert" on todo_tasks for insert
  with check (
    user_id = auth.uid()
    and company_id in (select public.get_my_company_ids())
  );

create policy "todo_update" on todo_tasks for update
  using (
    user_id = auth.uid()
    and company_id in (select public.get_my_company_ids())
  );

create policy "todo_delete" on todo_tasks for delete
  using (
    user_id = auth.uid()
    and company_id in (select public.get_my_company_ids())
  );

-- Auto-update updated_at
create trigger todo_tasks_updated_at
  before update on public.todo_tasks
  for each row execute function public.handle_updated_at();

-- Indexes for common queries
create index todo_tasks_user_company_idx on todo_tasks (user_id, company_id);
create index todo_tasks_status_idx on todo_tasks (status) where status != 'done';
create index todo_tasks_deadline_idx on todo_tasks (deadline) where deadline is not null;
