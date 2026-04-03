import type { ComponentType, ReactNode } from 'react';

/**
 * The Module Contract.
 * Every feature module must export a default object satisfying this interface.
 * The core platform uses this to:
 *   1. Register the module
 *   2. Aggregate its permissions into the central RBAC engine
 *   3. Mount its routes
 *   4. Render its navigation items (filtered by permissions)
 */
export interface ModuleDefinition {
  /** Unique module identifier (e.g. 'dummy', 'crm', 'invoices') */
  key: string;

  /** Human-readable module name (used in UI) */
  name: string;

  /** Localization key for the module name (e.g. 'modules.dummy.name') */
  nameKey: string;

  /** Semantic version */
  version: string;

  /** Module keys this module depends on (validated at load time) */
  dependsOn: string[];

  /** Permission manifest — what this module declares */
  permissions: PermissionManifest;

  /** Route definitions for this module */
  routes: ModuleRoute[];

  /** Navigation items for this module */
  navigation: NavigationItem[];

  /** Dashboard widgets this module contributes (optional) */
  dashboardWidgets?: DashboardWidget[];
}

/**
 * Permission manifest declared by a module.
 */
export interface PermissionManifest {
  /** Must match the module key */
  moduleKey: string;

  /** All permissions this module declares */
  permissions: PermissionDefinition[];
}

/**
 * A single permission definition.
 */
export interface PermissionDefinition {
  /** Unique permission key (convention: `module.action`, e.g. `dummy.view`) */
  key: string;

  /** Human-readable name */
  name: string;

  /** i18n key for the permission name */
  nameKey: string;

  /** Description of what this permission grants */
  description: string;
}

/**
 * A route definition within a module.
 */
export interface ModuleRoute {
  /** Route path (relative to module base, e.g. '/' or '/create') */
  path: string;

  /** The React component to render */
  element: ReactNode;

  /** Permission required to access this route (null = any authenticated user) */
  requiredPermission?: string;

  /** Child routes */
  children?: ModuleRoute[];
}

/**
 * A navigation item for the sidebar/menu.
 */
export interface NavigationItem {
  /** Display label */
  label: string;

  /** i18n key for the label */
  labelKey: string;

  /** Lucide icon name */
  icon: string;

  /** Route path to navigate to */
  path: string;

  /** Permission required to see this nav item */
  requiredPermission?: string;

  /** Nested navigation items */
  children?: NavigationItem[];

  /** Sort order (lower = higher in menu) */
  order?: number;
}

/**
 * A dashboard widget contributed by a module.
 * Modules export these from a `dashboard/` folder.
 */
export interface DashboardWidget {
  /** Unique widget key (convention: `module.widget_name`) */
  key: string;

  /** Human-readable title */
  title: string;

  /** i18n key for the title */
  titleKey: string;

  /** The React component to render */
  component: ComponentType;

  /** Grid column span: 1 = third, 2 = two-thirds, 3 = full width */
  colSpan?: 1 | 2 | 3;

  /** Sort order on the dashboard (lower = earlier) */
  order?: number;

  /** Permission required to see this widget (null = any authenticated user) */
  requiredPermission?: string;
}
