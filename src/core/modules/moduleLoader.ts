import type { ModuleDefinition } from './types';
import { moduleRegistry } from './moduleRegistry';
import { validateDependencies, sortByDependencyOrder } from './dependencyValidator';

/**
 * Dynamically loads all modules from src/modules/{name}/module.config.tsx.
 * Uses Vite's import.meta.glob for automatic discovery.
 *
 * Flow:
 * 1. Glob-import all module.config.tsx files
 * 2. Validate each module satisfies the contract
 * 3. Validate dependencies
 * 4. Sort by dependency order
 * 5. Register each module in the registry
 */
export async function loadModules(): Promise<void> {
  console.info('[ModuleLoader] Discovering modules...');

  // Vite glob import — eagerly imports all module configs from modules/ and core/
  const featureModules = import.meta.glob<{ default: ModuleDefinition }>(
    '/src/modules/*/module.config.tsx',
    { eager: true }
  );
  const coreModules = import.meta.glob<{ default: ModuleDefinition }>(
    '/src/core/*/module.config.tsx',
    { eager: true }
  );
  const moduleFiles = { ...coreModules, ...featureModules };

  const modules: ModuleDefinition[] = [];

  for (const [path, mod] of Object.entries(moduleFiles)) {
    const moduleConfig = mod.default;

    // Validate the contract
    const errors = validateModuleContract(moduleConfig, path);
    if (errors.length > 0) {
      console.error(`[ModuleLoader] Module at "${path}" failed validation:`);
      errors.forEach(e => console.error(`  - ${e}`));
      continue;
    }

    modules.push(moduleConfig);
  }

  console.info(`[ModuleLoader] Found ${modules.length} valid module(s)`);

  // Validate dependencies across all modules
  const depErrors = validateDependencies(modules);
  if (depErrors.length > 0) {
    console.error('[ModuleLoader] Dependency validation failed:');
    depErrors.forEach(e => console.error(`  - ${e}`));
    throw new Error(`Module dependency validation failed:\n${depErrors.join('\n')}`);
  }

  // Sort by dependency order and register
  const sorted = sortByDependencyOrder(modules);
  for (const mod of sorted) {
    moduleRegistry.register(mod);
  }

  console.info(`[ModuleLoader] All modules loaded and registered successfully`);
}

/**
 * Validates that a module config object satisfies the ModuleDefinition contract.
 */
function validateModuleContract(config: unknown, path: string): string[] {
  const errors: string[] = [];
  const mod = config as Record<string, unknown>;

  if (!mod || typeof mod !== 'object') {
    return [`Module at ${path} does not export a valid object`];
  }

  if (typeof mod.key !== 'string' || !mod.key) {
    errors.push('Missing or invalid "key" (must be a non-empty string)');
  }

  if (typeof mod.name !== 'string' || !mod.name) {
    errors.push('Missing or invalid "name" (must be a non-empty string)');
  }

  if (typeof mod.version !== 'string' || !mod.version) {
    errors.push('Missing or invalid "version" (must be a non-empty string)');
  }

  if (!Array.isArray(mod.dependsOn)) {
    errors.push('Missing or invalid "dependsOn" (must be an array)');
  }

  if (!mod.permissions || typeof mod.permissions !== 'object') {
    errors.push('Missing or invalid "permissions" (must be a PermissionManifest)');
  } else {
    const perms = mod.permissions as Record<string, unknown>;
    if (perms.moduleKey !== mod.key) {
      errors.push(`Permission manifest moduleKey ("${perms.moduleKey}") must match module key ("${mod.key}")`);
    }
    if (!Array.isArray(perms.permissions)) {
      errors.push('permissions.permissions must be an array');
    }
  }

  if (!Array.isArray(mod.routes)) {
    errors.push('Missing or invalid "routes" (must be an array)');
  }

  if (!Array.isArray(mod.navigation)) {
    errors.push('Missing or invalid "navigation" (must be an array)');
  }

  return errors;
}
