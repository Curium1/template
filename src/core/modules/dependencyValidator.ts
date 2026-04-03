import type { ModuleDefinition } from './types';

/**
 * Validates that all module dependencies are satisfied.
 * Uses topological awareness — checks that a module's `dependsOn` list
 * only references modules that are present in the full set.
 *
 * @returns Array of error messages (empty = valid)
 */
export function validateDependencies(modules: ModuleDefinition[]): string[] {
  const errors: string[] = [];
  const moduleKeys = new Set(modules.map(m => m.key));

  for (const mod of modules) {
    for (const dep of mod.dependsOn) {
      if (!moduleKeys.has(dep)) {
        errors.push(
          `Module "${mod.key}" depends on "${dep}", but "${dep}" is not registered.`
        );
      }
    }
  }

  // Check for circular dependencies
  const circularErrors = detectCircularDependencies(modules);
  errors.push(...circularErrors);

  return errors;
}

/**
 * Detects circular dependencies using DFS.
 */
function detectCircularDependencies(modules: ModuleDefinition[]): string[] {
  const errors: string[] = [];
  const adjacency = new Map<string, string[]>();

  for (const mod of modules) {
    adjacency.set(mod.key, mod.dependsOn);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(key: string, path: string[]): boolean {
    if (inStack.has(key)) {
      const cycle = [...path.slice(path.indexOf(key)), key];
      errors.push(`Circular dependency detected: ${cycle.join(' → ')}`);
      return true;
    }
    if (visited.has(key)) return false;

    visited.add(key);
    inStack.add(key);

    const deps = adjacency.get(key) ?? [];
    for (const dep of deps) {
      if (adjacency.has(dep)) {
        dfs(dep, [...path, key]);
      }
    }

    inStack.delete(key);
    return false;
  }

  for (const mod of modules) {
    if (!visited.has(mod.key)) {
      dfs(mod.key, []);
    }
  }

  return errors;
}

/**
 * Returns modules sorted in dependency order (dependencies first).
 */
export function sortByDependencyOrder(modules: ModuleDefinition[]): ModuleDefinition[] {
  const sorted: ModuleDefinition[] = [];
  const visited = new Set<string>();
  const moduleMap = new Map(modules.map(m => [m.key, m]));

  function visit(mod: ModuleDefinition) {
    if (visited.has(mod.key)) return;
    visited.add(mod.key);

    for (const dep of mod.dependsOn) {
      const depMod = moduleMap.get(dep);
      if (depMod) visit(depMod);
    }

    sorted.push(mod);
  }

  for (const mod of modules) {
    visit(mod);
  }

  return sorted;
}
