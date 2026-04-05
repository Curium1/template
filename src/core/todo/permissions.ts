import type { PermissionManifest } from '../modules/types';

export const todoPermissions: PermissionManifest = {
  moduleKey: 'todo',
  permissions: [
    {
      key: 'todo.view',
      name: 'Visa uppgifter',
      nameKey: 'modules.todo.permissions.view',
      description: 'Visa uppgifter och notiser',
    },
  ],
};
