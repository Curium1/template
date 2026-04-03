-- ============================================
-- Dummy module schema
-- Module: dummy
-- Tables: dummy_items
-- ============================================

create table if not exists public.dummy_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'active',
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dummy_items enable row level security;

create policy "dummy_select" on dummy_items for select
  using (company_id in (select public.get_my_company_ids()));
create policy "dummy_insert" on dummy_items for insert
  with check (company_id in (select public.get_my_company_ids()));
create policy "dummy_update" on dummy_items for update
  using (company_id in (select public.get_my_company_ids()));
create policy "dummy_delete" on dummy_items for delete
  using (company_id in (select public.get_my_company_ids()));

-- Auto-update updated_at
create trigger dummy_items_updated_at
  before update on public.dummy_items
  for each row execute function public.handle_updated_at();
