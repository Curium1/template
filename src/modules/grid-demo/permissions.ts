import type { PermissionManifest } from '../../core/modules/types';

export const gridDemoPermissions: PermissionManifest = {
  moduleKey: 'grid_demo',
  permissions: [
    {
      key: 'grid_demo.view',
      name: 'Visa',
      nameKey: 'modules.grid_demo.permissions.view',
      description: 'Visa DataGrid demo',
    },
  ],
};
