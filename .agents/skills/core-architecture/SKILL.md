---
name: core-architecture
description: Core architectural rules and conventions for the modular web application platform. ALWAYS consult this skill before writing any code in this project. It defines the module contract, RBAC model, multi-tenancy, folder conventions, notification/todo system, and coding standards.
---

> **⚠️ SELF-UPDATE RULE**: Whenever you modify files inside `src/core/` (adding, removing, or changing shared infrastructure, grid features, layout, auth, authorization, modules, notifications, or any other core subsystem), you **MUST** update this skill to reflect those changes before finishing your task. This includes folder structure, tech stack, feature lists, code examples, and anti-patterns. Related skills (e.g. `datagrid-usage`) must also be kept in sync.

# Core Architecture — Modular Platform Rules

**This skill is the single source of truth for how this project is structured.** Read it before making any code changes.

## Architecture Overview

This is a **modular monolith**: a single Vite + React 19 + TypeScript application with a strict separation between:

1. **Core platform** (`src/core/`) — Owns auth, authorization, routing, layout, company context, notifications, shared infrastructure. Also contains **core modules** (todo, user-admin) that are platform-level functionality.
2. **Feature modules** (`src/modules/<module>/`) — Self-contained business features that plug into the core via a formal contract. Each module declares its own permissions, routes, navigation, DB schema, and dashboard widgets.

```
src/
├── core/                          # PLATFORM — never touch for module work
│   ├── auth/                      # Supabase auth (context, hooks, components)
│   ├── authorization/             # RBAC engine (context, guards, resolver)
│   ├── company/                   # Multi-tenancy (CompanyContext, types, hooks)
│   ├── modules/                   # Module system (loader, registry, contract)
│   ├── layout/                    # AppShell, Sidebar, Header
│   ├── notifications/             # Notification/Todo system (context, panel, types)
│   ├── shared/                    # UI primitives, API client, grid, i18n
│   │   ├── api/                   # supabaseClient.ts
│   │   ├── components/            # Shared UI components
│   │   ├── grid/                  # MyDataGrid component (TanStack Table internally)
│   │   ├── hooks/                 # Shared React hooks
│   │   ├── i18n/                  # i18next config, locale: sv
│   │   └── store/                 # Shared zustand stores
│   ├── router/                    # Root router assembly
│   ├── landing/                   # DashboardPage (aggregates module widgets)
│   ├── todo/                      # Core module: Task/notification management
│   └── user-admin/                # Core module: User & role management
├── modules/                       # FEATURES — each a self-contained module
│   └── <module_key>/
│       ├── components/            # Module-specific UI components
│       ├── pages/                 # Full page components
│       ├── hooks/                 # Module-specific React Query hooks
│       ├── dashboard/             # Dashboard widgets contributed to core
│       ├── store/                 # Module-local zustand stores
│       ├── permissions.ts         # Permission manifest
│       ├── navigation.ts          # Sidebar navigation items
│       ├── module.config.tsx      # Module definition (the contract)
│       ├── schema.sql             # Module DB schema (tables, RLS)
│       ├── i18n/                  # sv.ts + en.ts translations
│       ├── types.ts               # Module-specific TypeScript types
│       └── README.md              # Module documentation
```

## The Module Contract

Every module MUST export a default `ModuleDefinition` from `module.config.tsx`:

```tsx
// Feature module (src/modules/<key>/module.config.tsx):
import type { ModuleDefinition } from '../../core/modules/types';

// Core module (src/core/<key>/module.config.tsx):
import type { ModuleDefinition } from '../modules/types';

const moduleDefinition: ModuleDefinition = {
  key: 'my_module',                    // Unique identifier, snake_case
  name: 'My Module',                   // Display name
  nameKey: 'modules.my_module.name',   // i18n key
  version: '1.0.0',                    // Semver
  dependsOn: [],                       // Other module keys this depends on
  permissions: myModulePermissions,     // PermissionManifest
  routes: myModuleRoutes,              // ModuleRoute[]
  navigation: myModuleNavigation,      // NavigationItem[]
  dashboardWidgets: myDashboardWidgets, // DashboardWidget[] (optional)
};

export default moduleDefinition;
```

> **Module discovery**: The module loader (`src/core/modules/moduleLoader.ts`) uses two Vite glob imports to discover modules:
> - `/src/core/*/module.config.tsx` — Core modules (platform-level: todo, user-admin)
> - `/src/modules/*/module.config.tsx` — Feature modules (business domain)
>
> Both are merged at startup. Core modules take precedence in case of key collisions.

### Permission Manifest

Every module declares its own permissions in `permissions.ts`:

```ts
import type { PermissionManifest } from '../../core/modules/types';

export const myModulePermissions: PermissionManifest = {
  moduleKey: 'my_module',   // MUST match module key
  permissions: [
    {
      key: 'my_module.view',
      name: 'Visa',
      nameKey: 'modules.my_module.permissions.view',
      description: 'View items',
    },
    // ... more permissions
  ],
};
```

**Permission key convention**: `<module_key>.<action>` (e.g., `crm.view`, `invoices.create`).

### Navigation

Every module declares its sidebar navigation in `navigation.ts`:

```ts
import type { NavigationItem } from '../../core/modules/types';

export const myModuleNavigation: NavigationItem[] = [
  {
    label: 'My Module',
    labelKey: 'modules.my_module.name',
    icon: 'box',                      // Lucide icon name (kebab-case)
    path: '/my-module',
    order: 50,                        // Lower = higher in sidebar
    children: [                       // Optional submenu items
      {
        label: 'List',
        labelKey: 'modules.my_module.list',
        icon: 'list',
        path: '/my-module',
      },
      {
        label: 'Settings',
        labelKey: 'modules.my_module.settings',
        icon: 'settings',
        path: '/my-module/settings',
        requiredPermission: 'my_module.manage',
      },
    ],
  },
];
```

### Dashboard Widgets

Modules can contribute widgets to the central dashboard via a `dashboard/` folder:

```tsx
// modules/my_module/dashboard/MyWidget.tsx
import type { DashboardWidget } from '../../../core/modules/types';

function MyWidget() {
  return <div>Widget content</div>;
}

export const myModuleWidgets: DashboardWidget[] = [
  {
    key: 'my_module.overview',         // Unique widget key
    title: 'Översikt',                 // Display title
    titleKey: 'modules.my_module.dashboardOverview',
    component: MyWidget,               // React component (not element)
    colSpan: 2,                        // 1 = third, 2 = two-thirds, 3 = full
    order: 10,                         // Lower = earlier on dashboard
    requiredPermission: 'my_module.view',
  },
];
```

The `DashboardPage` in `core/landing/` automatically aggregates and renders all module widgets, filtered by the current user's permissions.

### Module DB Schema (`schema.sql`)

Every module that persists data to Supabase MUST include a `schema.sql` file documenting its database tables, RLS policies, and any triggers or functions. This file serves as the source of truth for the module's database layer and is used during project setup (see the `supabase-setup` skill).

```sql
-- schema.sql for my_module
-- Run via Supabase MCP apply_migration

create table if not exists public.my_module_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.my_module_items enable row level security;

create policy "my_module_select" on my_module_items for select
  using (company_id in (select public.get_my_company_ids()));
create policy "my_module_insert" on my_module_items for insert
  with check (company_id in (select public.get_my_company_ids()));
create policy "my_module_update" on my_module_items for update
  using (company_id in (select public.get_my_company_ids()));
create policy "my_module_delete" on my_module_items for delete
  using (company_id in (select public.get_my_company_ids()));
```

**Schema conventions:**
- Table names: `<module_key>_<entity>` (e.g., `todo_tasks`, `crm_contacts`)
- Always include `company_id` column with FK to `companies(id)`
- Always enable RLS using `get_my_company_ids()`
- Include `created_at` and `updated_at` timestamps
- Use the `handle_updated_at()` trigger for auto-updating `updated_at`

### Adding a New Module — Checklist

1. Create folder `src/modules/<key>/`
2. Create `permissions.ts` with the permission manifest
3. Create `navigation.ts` with sidebar navigation items
4. Create page components in `pages/`
5. Create `i18n/sv.ts` and `i18n/en.ts` with module-scoped translations
6. Create `module.config.tsx` — import i18n files and call `registerModuleTranslations({ sv, en })`
7. Create `schema.sql` documenting the module's DB tables and RLS policies
8. *(Optional)* Create `dashboard/` folder with dashboard widgets
9. *(Optional)* Create `components/` folder for module-specific UI components
10. Create `README.md` documenting the module
11. **Done** — the module loader auto-discovers `module.config.tsx` via Vite glob

**You NEVER need to**: modify AppRouter, modify Sidebar, add imports to App.tsx, or touch any core i18n file. Permissions are resolved dynamically from the company's `company_roles` table.

## Notification & Todo System

The platform includes a centralized, module-agnostic **notification and todo system** in `src/core/notifications/`. Modules push notifications, which appear in both the header bell and the Todo module.

### Architecture

```
Module calls push()
       ↓
NotificationContext (global state)
       ↓
  ┌────┴────┐
  │  Bell   │  (Header) — shows only unread + unmuted items
  │  icon   │  Click → marks as read, navigates to path
  └─────────┘
       ↓
  ┌────┴────┐
  │  Todo   │  (Module at /todo) — shows all items
  │  Module │  List + Kanban views, search, filter tabs
  └─────────┘
```

### Notification Lifecycle

1. **Module pushes** notification via `useNotifications().push()` — appears in bell + todo as `new`
2. **User clicks in bell** → marks as read (removed from bell), navigates to target path
3. **In todo module**: user can transition status `new` → `in_progress` → `done` (via actions or kanban drag)
4. **Done** items: disappear from active view, searchable in "Slutförda" filter tab
5. **Muted** items: disappear from both bell and active view, searchable in "Tystade" tab

### Types

```ts
type TodoStatus = 'new' | 'in_progress' | 'done';
type NotificationPriority = 'low' | 'medium' | 'high';
type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;                    // Every N (days/weeks/months/years)
  weekdays?: Weekday[];                // Weekly: which days (0=Mon ... 6=Sun)
  monthlyMode?: MonthlyMode;           // 'day_of_month' | 'weekday_position' | 'workday'
  dayOfMonth?: number;                 // For day_of_month / yearly
  weekdayPosition?: WeekdayPosition;   // 'first' | 'second' | 'third' | 'fourth' | 'last'
  weekday?: Weekday;                   // For weekday_position mode
  workdayNumber?: number;              // For workday mode (N-th workday)
  month?: number;                      // For yearly (0=Jan ... 11=Dec)
}

interface AppNotification {
  id: string;
  moduleKey: string;                   // Which module created this
  moduleLabel: string;                 // Human-readable module name
  moduleLabelKey: string;              // i18n key for module name
  title: string;
  description?: string;
  icon?: string;                       // Lucide icon name
  path: string;                        // Navigate-to path when clicked
  createdAt: Date;
  deadline?: Date;
  priority: NotificationPriority;
  read: boolean;                       // Read = gone from bell
  status: TodoStatus;                  // For kanban/list tracking
  muted: boolean;                      // Muted = hidden from bell + active view
  recurrence?: RecurrenceRule;         // Optional recurring schedule
}
```

### API (`useNotifications()`)

```ts
const {
  notifications,             // All notifications (newest first)
  bellCount,                  // Count of unread + unmuted
  push(notification),         // Add new notification
  markAsRead(id),             // Mark as read (removes from bell)
  markAllAsRead(),            // Mark all bell-visible as read
  mute(id),                   // Mute (removes from bell, keeps in todo)
  setStatus(id, status),      // Change todo status (done also marks read)
  dismiss(id),                // Remove entirely
  clearAll(),                 // Remove all
} = useNotifications();
```

### Pushing Notifications from Modules

Any module can push notifications via the context:

```tsx
import { useNotifications } from '../../../core/notifications';

function MyComponent() {
  const { push } = useNotifications();

  useEffect(() => {
    push({
      moduleKey: 'my_module',
      moduleLabel: 'My Module',
      moduleLabelKey: 'modules.my_module.name',
      title: 'Something happened',
      description: 'Details about the event.',
      icon: 'bell',                    // Lucide icon name
      path: '/my-module/item/123',     // Where to navigate when clicked
      priority: 'medium',
      deadline: new Date('2026-04-10'), // Optional
    });
  }, []);
}
```

### Todo Module Features

The built-in Todo module (`src/modules/todo/`) provides:
- **List view**: Sortable table with status badges, quick-action buttons
- **Kanban view**: Drag-and-drop columns (Ny → Pågående → Klar)
- **Create task**: Header action button opens modal with title, description, priority, deadline, and **recurrence settings**
- **Recurrence options**: Daily (every N days), Weekly (weekday picker + interval), Monthly (day of month / weekday position / N-th workday + interval), Yearly (month + day + interval)
- **Filter tabs**: Aktiva, Slutförda, Tystade, Alla
- **Time-windowed loading**: Default shows overdue + next 7 days, infinite scroll loads 14 more days per page
- **Search**: Bypasses time window, searches across title, description, module label

## Multi-Tenancy Model

This platform is **multi-tenant at the company level**. Every user can belong to multiple companies, and all business data is scoped by `company_id`.

### Database Schema

```
auth.users (Supabase Auth)
  └── user_profiles (1:1, extends auth.users)
        └── company_members (N:M via this join table)
              ├── → companies
              └── → company_roles
```

| Table | Purpose |
|-------|---------|
| `companies` | Tenant entity. Has `name`, `slug`, `brand_color` (hex, default `#E53E3E`) |
| `company_members` | Join table: user ↔ company ↔ role |
| `company_roles` | Per-company roles with a `permissions` JSON array |
| `user_profiles` | Extends `auth.users` with `display_name`, `avatar_url` |

### Company Context

`CompanyContext` (`src/core/company/context/CompanyContext.tsx`) provides:

```ts
interface CompanyState {
  companies: Company[];           // All companies the user belongs to
  activeCompany: Company | null;  // Currently selected company
  activeMembership: CompanyMember | null;
  activeRole: CompanyRole | null;
  isLoading: boolean;
  switchCompany: (companyId: string) => void;
}
```

The `activeCompany.brand_color` is used by the Sidebar for the submenu accent dash and parent icon color. It can be configured per company (defaults to red `#E53E3E`).

## RBAC Model

### How Roles Work

Roles are **per-company**, stored in the `company_roles` table. Each role has a `permissions` array of permission strings (e.g., `["dummy.view", "dummy.create"]`). The wildcard `"*"` grants all permissions.

**System roles** (seeded automatically, `is_system = true`):

| Role | Slug | Permissions |
|------|------|-------------|
| Super Admin | `super_admin` | `["*"]` — full access |
| Admin | `admin` | All module permissions |
| Användare | `user` | View-only permissions |

**Custom roles**: Users with `user_admin.manage_roles` permission can create custom roles with any combination of permissions via the Roles page permission matrix.

### Authorization Flow

1. User logs in via Supabase Auth
2. `AuthContext` fetches user profile from `user_profiles`
3. `CompanyContext` fetches the user's `company_members` rows (with joined `company_roles`)
4. `AuthorizationContext` resolves effective permissions from the active company's role:
   - Reads `activeRole.permissions` array from `CompanyContext`
   - Wildcard `*` = all permissions from all registered modules
5. Components use `can()`, `canAny()`, `canAll()`, `canAccessModule()` to check access

### Guards

| Component | Purpose | Usage |
|-----------|---------|-------|
| `<ProtectedRoute permission="x">` | Route-level guard | Wrap route elements |
| `<ProtectedAction permission="x">` | Action-level guard | Wrap buttons/actions |
| `useAuthorization().can('x')` | Programmatic check | In component logic |

## Layout Architecture

### Mobile-First Responsive Design

The layout is **mobile-first** with a single breakpoint at `md` (768px):

| Viewport | Sidebar | Header | Behavior |
|----------|---------|--------|----------|
| **<768px** (mobile) | Hidden — opens as overlay drawer via hamburger | Shows hamburger icon (left) | Drawer auto-closes on navigation |
| **≥768px** (desktop) | Persistent — collapsible (60px/240px) | No hamburger | Collapse state persisted in `localStorage` |

When building new pages or components, always design for **mobile widths first**, then add `sm:`, `md:`, `lg:` breakpoints as needed.

### AppShell

`AppShell` (`src/core/layout/AppShell.tsx`) manages the main layout with two sidebar modes:

- **Desktop** (`≥md`): persistent sidebar, collapsible to icon-only rail
- **Mobile** (`<md`): sidebar hidden; hamburger button in Header triggers a full-height drawer overlay with blurred backdrop
- The drawer auto-closes on `location.pathname` change (React Router)
- Wrapped in `PageMetaProvider` — pages set their title, subtitle, and action buttons; Header reads them

The Header is rendered **inside** the scrollable content area, within the same `max-w-screen-2xl` container as the page content. This creates a seamless, borderless design — no divider or background change between header and content. Responsive padding: `px-4 sm:px-6 lg:px-8`.

### Sidebar

- Accepts `isMobile?: boolean` prop — when true, always renders expanded (never icon-rail) and shows X close button instead of collapse toggle
- Collapsible (60px collapsed / 240px expanded) on desktop
- Brand name at the top
- Module section label ("Moduler")
- Menu groups with expandable submenus
- **Active submenu indicator**: thin vertical connector line (1px, `border` color) runs alongside all submenu items; chosen item gets a thicker 3px dash in the company's `brand_color`
- **Parent icon color**: when a group's submenu is expanded/active, the parent icon renders in `brand_color`
- **Modules without submenus**: parent icon renders in `brand_color` when the route is active
- **User panel at bottom**: avatar circle (initials), display name, role name. Click opens an upward popover with user info + logout. Company switcher and bell are NOT in the sidebar — they stay in the Header.

### Header & Page Titles

The Header owns the page title, subtitle, hamburger icon (mobile), and is the render target for page-specific action buttons. **Pages must NOT render their own `<h1>`, subtitle, or inline action bar** — instead they use the `usePageHeader` hook:

```tsx
import { usePageHeader } from '../../../core/layout/usePageHeader';

export function MyPage() {
  const { t } = useTranslation();

  usePageHeader({
    title: t('modules.my_module.pageTitle', 'My Page'),
    subtitle: t('modules.my_module.pageSubtitle', 'Description here.'),
    actions: (
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90">
        Action
      </button>
    ),
  });

  return (
    <div>
      {/* Content only — no title or action bar rendering */}
    </div>
  );
}
```

Header layout (single `h-14` row, aligned with sidebar brand bar):
- **Left**: hamburger icon (`md:hidden`, opens mobile drawer) + page title (`text-[15px] font-semibold`) + subtitle (`text-[13px] text-muted-foreground`, hidden on `<sm`)
- **Right** (in order): company name/switcher (`hidden sm:flex`), notification bell, **page actions** (far right, injected via `usePageHeader({ actions })`)
- No breadcrumb, no border, no user avatar — integrated into content surface
- Content container uses `max-w-screen-2xl` with responsive padding (`px-4 sm:px-6 lg:px-8`)

### Responsive Guidelines for Module Pages

When building module pages, follow these patterns:

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Grid layouts | `grid-cols-1` | `sm:grid-cols-2 lg:grid-cols-3` |
| Side-by-side panels | Stack vertically | `md:flex-row` |
| Data tables | Horizontal scroll or card list | Full table |
| Modals | Full-screen (`fixed inset-0`) | Centered overlay (`max-w-lg mx-auto`) |
| Action buttons | Icon-only or condensed | Full text with icon |
| Padding | `px-4` | `sm:px-6 lg:px-8` |

Key utilities:
- `hidden sm:block` — hide on mobile, show on `≥640px`
- `md:hidden` — show only on mobile
- `truncate` — prevent text overflow on narrow screens
- `min-w-0` — allow flex items to shrink below content size

## i18n Architecture

Translations are **strictly module-contained**. Each module owns its own translation files.

### Core translations
`src/core/shared/i18n/i18n.ts` — only core/shared keys (auth, layout, roles, theme, notifications).

### Module translations
Each module has an `i18n/` folder:
```
src/modules/<key>/
  i18n/
    sv.ts    ← export const sv: Record<string, string> = { ... }
    en.ts    ← export const en: Record<string, string> = { ... }
```

Registered in the module's `module.config.tsx`:
```tsx
import { registerModuleTranslations } from '../../core/shared/i18n/i18n';
import { sv } from './i18n/sv';
import { en } from './i18n/en';

registerModuleTranslations({ sv, en });
```

Key conventions:
- Module keys: `modules.<module_key>.<label>` (e.g. `modules.dummy.list`)
- Core keys: `auth.*`, `layout.*`, `roles.*`, `theme.*`, `notifications.*`
- Default locale: `sv`, fallback: `en`
- **Never add module translations to the core i18n file**

## Theme / Dark Mode

The app supports **light**, **dark**, and **system** themes via `ThemeProvider` (`src/core/theme/ThemeProvider.tsx`).

- Wraps the entire `App` at the outermost level
- Applies `.light` or `.dark` class to `<html>` element
- CSS variables in `index.css` define both palettes (`:root` for light, `.dark` for dark)
- Persisted to `localStorage` (key: `theme-preference`)
- System mode auto-tracks OS preference via `prefers-color-scheme` media query
- Toggle lives in the sidebar user panel popover (Sun/Moon/Monitor icons)
- Use `useTheme()` hook to access `{ theme, resolvedTheme, setTheme }`

## Tech Stack & Conventions

| Aspect | Standard |
|--------|----------|
| **Framework** | React 19 + Vite |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 |
| **Auth** | Supabase Auth (`@supabase/supabase-js`) |
| **Database** | Supabase Postgres with RLS |
| **Routing** | React Router v7 |
| **Data fetching** | TanStack React Query (`@tanstack/react-query`) |
| **Data tables** | MyDataGrid (TanStack Table v8 internally) — sole grid component |
| **i18n** | i18next — module-local translations, default locale `sv` |
| **Theming** | CSS variables + `.dark` class, `ThemeProvider` context |
| **Icons** | Lucide React |
| **State** | React Context + hooks + zustand for local stores |

### MyDataGrid Usage (Preferred)

Use `MyDataGrid` from `src/core/shared/grid/` for all data tables. This is our own grid component powered by TanStack Table internally but exposing only our own public API. **Never import `@tanstack/react-table` directly in module code.**

```tsx
import { MyDataGrid } from '../../../core/shared/grid';
import type { GridColumn } from '../../../core/shared/grid';

const columns: GridColumn<MyType>[] = [
  { id: 'name', field: 'name', headerName: 'Namn', width: 200 },
  { id: 'status', field: 'status', headerName: 'Status', filterType: 'enum' },
  { id: 'amount', field: 'amount', headerName: 'Belopp', filterType: 'number', aggregation: 'sum' },
];

<MyDataGrid<MyType>
  rows={data}
  columns={columns}
  rowKey="id"
  height={500}
  features={{ filtering: true, sorting: true, grouping: true, selection: 'multi' }}
/>
```

Key architecture rules:
- **Public API only**: Modules import from `core/shared/grid` — never from `@tanstack/react-table`
- **Own column schema**: Use `GridColumn<T>` (our type), not TanStack `ColumnDef`
- **Adapter isolation**: TanStack types are confined to `core/shared/grid/adapter/`
- **Swappable internals**: If TanStack is ever replaced, only the adapter layer changes

Features: filtering (50+ operators), sorting, grouping with aggregation, selection (single/multi), virtualization, column pinning, column visibility, saved views, CSV export, inline editing, pagination, row actions (slot pattern), toolbar toggles.

> **For full API reference, feature tiers, and code patterns**, consult the **`datagrid-usage`** skill.

### Coding Standards

1. **Feature-based structure** — Group by feature, not by type
2. **Small, focused components** — One responsibility per component
3. **i18n everything** — All user-facing strings via `t('key')`, Swedish default
4. **Tailwind only** — No CSS files per component, use Tailwind classes
5. **Semantic color tokens** — Use `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-primary`, etc. Never hardcode hex values (exception: `brand_color` via inline style)
6. **RLS on all business tables** — Every Supabase table must have RLS using `public.get_my_company_ids()` helper
7. **Module DB schema** — Every module with persistence must include a `schema.sql` file

### File Naming

| Type | Convention | Example |
|------|-----------|---------||
| Components | PascalCase `.tsx` | `DummyList.tsx` |
| Pages | PascalCase + `Page` suffix | `DummyListPage.tsx` |
| Hooks | camelCase `use` prefix | `useCompanyRoles.ts` |
| Types | camelCase `.ts` | `types.ts` |
| Config | camelCase + `.config.tsx` | `module.config.tsx` |
| Permissions | `permissions.ts` | `permissions.ts` |
| Navigation | `navigation.ts` | `navigation.ts` |
| DB Schema | `schema.sql` | `schema.sql` |
| Dashboard widgets | PascalCase `Widget` suffix | `TeamOverviewWidget.tsx` |

### Import Conventions

```ts
// 1. React/library imports
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// 2. Core imports (relative from current module)
import { useAuth } from '../../core/auth/context/AuthContext';
import { ProtectedAction } from '../../core/authorization/components/ProtectedRoute';
import { useCompany } from '../../core/company/context/CompanyContext';
import { useNotifications } from '../../core/notifications';

// 3. Module-local imports
import { useCompanyRoles } from '../hooks/useCompanyRoles';
```

## Supabase Integration

### Client

The Supabase client is at `src/core/shared/api/supabaseClient.ts`. It reads from env vars:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Dev-mode note**: The client uses a custom no-op lock function to bypass `navigator.locks` and avoid `NavigatorLockAcquireTimeoutError` during HMR.

### Core Tables

```sql
-- Companies (tenants)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand_color text not null default '#E53E3E',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Company roles (per-company RBAC)
create table public.company_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  slug text not null,
  is_system boolean not null default false,
  permissions jsonb not null default '[]',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

-- Company members (user ↔ company ↔ role)
create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references company_roles(id),
  custom_permissions jsonb not null default '[]',
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- User profiles (extends auth.users)
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

All tables have RLS enabled.

### RLS Pattern

All business tables use the `public.get_my_company_ids()` helper function for company isolation:

```sql
-- Helper function: returns all company IDs the current user belongs to
create or replace function public.get_my_company_ids()
returns setof uuid
language sql stable security definer
as $$
  select company_id
  from public.company_members
  where user_id = auth.uid();
$$;

-- Core RLS policy pattern for any business table
create policy "company_isolation" on <table>
  using (company_id in (select public.get_my_company_ids()));
```

**Never use** `current_setting('app.current_company_id')` directly — always use the `get_my_company_ids()` helper.

## Anti-Patterns — DO NOT

- ❌ Put module business logic in `src/core/`
- ❌ Hardcode permissions in core (modules declare their own)
- ❌ Import from one module into another (use shared services or events)
- ❌ Skip the module contract (no "quick" direct route additions)
- ❌ Use CSS modules or styled-components (Tailwind only)
- ❌ Hardcode color hex values (use semantic tokens; exception: `brand_color` via inline style)
- ❌ Skip i18n for user-facing strings
- ❌ Create Supabase tables without RLS
- ❌ Use `current_setting('app.current_company_id')` — use `get_my_company_ids()` instead
- ❌ Import `@tanstack/react-table` directly — always use `MyDataGrid` from `core/shared/grid`
- ❌ Build custom `<table>` for data display — use `MyDataGrid` with minimal features
- ❌ Hardcode roles or permissions in a static map — they come from `company_roles` at runtime
- ❌ Create a module with DB persistence but no `schema.sql` file
- ❌ Push notifications without setting `moduleKey`, `path`, and `priority`
