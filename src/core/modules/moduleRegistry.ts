import type { ModuleDefinition, DashboardWidget } from './types';

/**
 * Central registry for all loaded modules.
 * Singleton pattern — the core uses this to query modules at runtime.
 */
class ModuleRegistryImpl {
  private modules = new Map<string, ModuleDefinition>();

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.key)) {
      console.warn(`[ModuleRegistry] Module "${module.key}" is already registered. Skipping duplicate.`);
      return;
    }
    this.modules.set(module.key, module);
    console.info(`[ModuleRegistry] Registered module: ${module.key} v${module.version}`);
  }

  getModule(key: string): ModuleDefinition | undefined {
    return this.modules.get(key);
  }

  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  getModuleKeys(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get all permissions declared across all registered modules.
   */
  getAllPermissions(): string[] {
    const permissions: string[] = [];
    for (const mod of this.modules.values()) {
      for (const perm of mod.permissions.permissions) {
        permissions.push(perm.key);
      }
    }
    return permissions;
  }

  /**
   * Get permissions for a specific module.
   */
  getModulePermissions(moduleKey: string): string[] {
    const mod = this.modules.get(moduleKey);
    if (!mod) return [];
    return mod.permissions.permissions.map(p => p.key);
  }

  /**
   * Check if a module is registered.
   */
  has(key: string): boolean {
    return this.modules.has(key);
  }

  /**
   * Get all navigation items across all modules, sorted by order.
   */
  getAllNavigation() {
    return this.getAllModules()
      .flatMap(m => m.navigation)
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  /**
   * Get all routes across all modules.
   */
  getAllRoutes() {
    return this.getAllModules().flatMap(m =>
      m.routes.map(route => ({
        ...route,
        // Prefix module routes with /module-key
        path: `/${m.key.replace(/_/g, '-')}${route.path === '/' ? '' : route.path}`,
      }))
    );
  }

  /**
   * Get all dashboard widgets across all modules, sorted by order.
   */
  getAllDashboardWidgets(): DashboardWidget[] {
    return this.getAllModules()
      .flatMap(m => m.dashboardWidgets ?? [])
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }
}

export const moduleRegistry = new ModuleRegistryImpl();
