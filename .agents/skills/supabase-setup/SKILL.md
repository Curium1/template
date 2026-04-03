---
name: supabase-setup
description: Step-by-step guide to set up the initial Supabase project when copying this template. Creates the required tables, RLS policies, auth configuration, and seed data. Also documents the per-module DB schema convention. Use this skill when starting a new project from this template.
---

# Supabase Setup — New Project Initialization

Run this workflow when you copy this template to start a new project. It creates all required Supabase infrastructure.

## Prerequisites

- A Supabase project (existing or new)
- The Supabase MCP server connected (e.g., `supabase-Sofielund` or `supabase-Noric`)
- Project ID available (run `list_projects` to find it)

## Step 1: Get Project Info

```
Use MCP: list_projects → find your project ID
Use MCP: get_project_url → get the API URL
Use MCP: get_publishable_keys → get the anon key
```

Create `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Step 2: Create Core Tables

Apply these migrations using the Supabase MCP `apply_migration` tool.

### Migration 1: `create_user_profiles`

```sql
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  locale text not null default 'sv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();
```

### Migration 2: `create_company_tables`

```sql
-- Companies (tenants)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}',
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

-- Company roles (per-company RBAC)
create table if not exists public.company_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  permissions text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique(company_id, slug)
);

alter table public.company_roles enable row level security;

-- Company members (user ↔ company join with role)
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.company_roles(id),
  custom_permissions text[] not null default '{}',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

alter table public.company_members enable row level security;

-- FK from company_members → user_profiles (required for PostgREST joins)
alter table public.company_members
  add constraint company_members_user_profile_fk
  foreign key (user_id) references public.user_profiles(id) on delete cascade;
```

### Migration 3: `create_rls_helper_function`

> **CRITICAL**: All RLS policies that need to check company membership MUST use this helper function. Direct subqueries on `company_members` within its own RLS policies cause infinite recursion.

```sql
-- SECURITY DEFINER function to resolve company IDs without triggering recursion
create or replace function public.get_my_company_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select company_id from public.company_members where user_id = auth.uid();
$$;
```

### Migration 4: `create_rls_policies`

```sql
-- Companies: members can read their own companies
create policy "companies_select"
  on public.companies for select
  using (id in (select public.get_my_company_ids()));

-- Company roles: members can read roles in their company
create policy "roles_select"
  on company_roles for select
  using (company_id in (select public.get_my_company_ids()));

create policy "roles_insert"
  on company_roles for insert
  with check (company_id in (select public.get_my_company_ids()));

create policy "roles_update"
  on company_roles for update
  using (company_id in (select public.get_my_company_ids()));

create policy "roles_delete"
  on company_roles for delete
  using (is_system = false and company_id in (select public.get_my_company_ids()));

-- Company members: use the helper function to avoid recursion
create policy "members_select"
  on company_members for select
  using (company_id in (select public.get_my_company_ids()));

create policy "members_insert"
  on company_members for insert
  with check (company_id in (select public.get_my_company_ids()));

create policy "members_update"
  on company_members for update
  using (company_id in (select public.get_my_company_ids()));

create policy "members_delete"
  on company_members for delete
  using (company_id in (select public.get_my_company_ids()));

-- User profiles: read own + company members' profiles
create policy "users_read_company_profiles"
  on user_profiles for select
  using (
    auth.uid() = id
    or id in (
      select cm.user_id from company_members cm
      where cm.company_id in (select public.get_my_company_ids())
    )
  );

create policy "users_update_own_profile"
  on user_profiles for update
  using (auth.uid() = id);
```

### Migration 5: `create_user_on_signup`

```sql
-- Auto-create user_profile on signup (NO roles column — roles are per-company)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Migration 6: `create_dummy_items`

```sql
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
```

### Migration 7: `create_todo_tasks`

```sql
-- Todo / notification persistence table
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

-- Index for common queries
create index todo_tasks_user_company_idx on todo_tasks (user_id, company_id);
create index todo_tasks_status_idx on todo_tasks (status) where status != 'done';
create index todo_tasks_deadline_idx on todo_tasks (deadline) where deadline is not null;
```

## Step 3: Seed Data

```sql
-- Default company
insert into public.companies (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Standardföretag', 'standard');

-- System roles (is_system = true means they can't be deleted)
insert into public.company_roles (id, company_id, name, slug, permissions, is_system) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Superadmin', 'superadmin', '{*}', true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Administratör', 'admin', '{dummy.read,dummy.create,dummy.update,dummy.delete,user_admin.view,user_admin.invite,todo.view}', true),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Chef', 'manager', '{dummy.read,dummy.create,dummy.update,todo.view}', true),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Användare', 'user', '{dummy.read,todo.view}', true);
```

## Step 4: Create Seed Users

> **IMPORTANT**: When inserting directly into `auth.users`, you MUST set `email_change`, `phone_change`, and similar string columns to empty strings (`''`), not NULL. GoTrue's Go scanner cannot parse NULL strings.

```sql
-- Create auth users
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token, recovery_token, email_change, phone_change, email_change_token_new, email_change_token_current, phone_change_token, reauthentication_token, is_sso_user)
values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'super@example.com', crypt('SuperAdmin123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Super Admin"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', false),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'admin@example.com', crypt('Admin123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin User"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', false),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'manager@example.com', crypt('Manager123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Manager User"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', false),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'user@example.com', crypt('User123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Regular User"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', false);

-- Identity entries (required for email/password login)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'super@example.com', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"super@example.com"}', 'email', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'admin@example.com', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"admin@example.com"}', 'email', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'manager@example.com', '{"sub":"a0000000-0000-0000-0000-000000000003","email":"manager@example.com"}', 'email', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'user@example.com', '{"sub":"a0000000-0000-0000-0000-000000000004","email":"user@example.com"}', 'email', now(), now(), now());

-- Company memberships
insert into public.company_members (company_id, user_id, role_id) values
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000014');
```

## Step 5: Apply Module Schemas

After the core tables are created, apply each module's `schema.sql` via Supabase MCP `apply_migration`. Module schemas are located at:

```
src/modules/<module_key>/schema.sql
```

**Application order**: Apply modules in dependency order. Check each module's `dependsOn` array in `module.config.tsx` to determine the correct sequence. Modules with no dependencies can be applied in any order.

### Per-module schema convention

Every module that persists data to Supabase **MUST** include a `schema.sql` file containing:
1. Table definitions with `company_id` FK to `companies(id)`
2. RLS policies using `get_my_company_ids()`
3. Indexes for common query patterns
4. Triggers (e.g., `handle_updated_at()`)

Table naming: `<module_key>_<entity>` (e.g., `todo_tasks`, `crm_contacts`, `dummy_items`)

### Currently registered module schemas

| Module | Schema file | Tables |
|--------|-------------|--------|
| `dummy` | Inline in step 2 (Migration 6) | `dummy_items` |
| `todo` | Inline in step 2 (Migration 7) | `todo_tasks` |
| `user_admin` | No custom tables (uses core `company_members`, `company_roles`) | — |

> **Note:** When creating a new module, add its `schema.sql` and reference it in this table. Then run the migration via `apply_migration`.

## Step 6: Configure Auth Settings

In the Supabase Dashboard → Authentication → Settings:

1. **Site URL**: Set to your dev URL (e.g., `http://localhost:5173`)
2. **Redirect URLs**: Add `http://localhost:5173/reset-password`
3. **Email**: Enable email login
4. **Disable** email confirmation for development (optional)

## Step 7: Verify

1. Start the dev server: `npm run dev`
2. Login with `super@example.com` / `SuperAdmin123!`
3. Verify sidebar shows all modules (Uppgifter, Dummy, Användare)
4. Verify company name "Standardföretag" shows in header
5. Navigate to Användare → verify 4 members with names
6. Navigate to Uppgifter → verify task creation modal works
7. Test role-based access by logging in as `user@example.com`

## ⚠️ Critical RLS Gotchas

1. **NEVER** write RLS policies on `company_members` that reference `company_members` in a subquery — it causes infinite recursion. Always use `public.get_my_company_ids()`.

2. **All business tables** must include `company_id uuid not null references companies(id)` and use `get_my_company_ids()` in their RLS policies.

3. **PostgREST joins** require explicit FK relationships. If you need to join `company_members` with `user_profiles`, ensure `company_members_user_profile_fk` exists.

4. **GoTrue NULL columns**: When inserting directly into `auth.users`, always set `email_change`, `phone_change`, etc. to empty strings, not NULL.

5. **User-scoped tables**: Tables like `todo_tasks` that are user-specific should add `user_id = auth.uid()` to their RLS policies in addition to `company_id` scoping.

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `super@example.com` | `SuperAdmin123!` | Superadmin (full access) |
| `admin@example.com` | `Admin123!` | Administratör |
| `manager@example.com` | `Manager123!` | Chef |
| `user@example.com` | `User123!` | Användare (basic) |

## Recurrence JSONB Format

The `todo_tasks.recurrence` column stores recurrence rules as JSONB. Format:

```json
{
  "frequency": "weekly",
  "interval": 2,
  "weekdays": [0, 1, 2, 3, 4]
}
```

```json
{
  "frequency": "monthly",
  "interval": 1,
  "monthlyMode": "weekday_position",
  "weekdayPosition": "first",
  "weekday": 0
}
```

```json
{
  "frequency": "yearly",
  "interval": 1,
  "month": 0,
  "dayOfMonth": 15
}
```

See `src/core/notifications/types.ts` → `RecurrenceRule` for the full TypeScript interface.
