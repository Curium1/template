import type { PermissionManifest } from '../../core/modules/types';

export const dummyPermissions: PermissionManifest = {
  moduleKey: 'dummy',
  permissions: [
    {
      key: 'dummy.view',
      name: 'Visa dummy',
      nameKey: 'modules.dummy.permissions.view',
      description: 'Visa dummy-poster',
    },
    {
      key: 'dummy.create',
      name: 'Skapa dummy',
      nameKey: 'modules.dummy.permissions.create',
      description: 'Skapa nya dummy-poster',
    },
    {
      key: 'dummy.edit',
      name: 'Redigera dummy',
      nameKey: 'modules.dummy.permissions.edit',
      description: 'Redigera befintliga dummy-poster',
    },
    {
      key: 'dummy.delete',
      name: 'Ta bort dummy',
      nameKey: 'modules.dummy.permissions.delete',
      description: 'Ta bort dummy-poster',
    },
    {
      key: 'dummy.admin',
      name: 'Administrera dummy',
      nameKey: 'modules.dummy.permissions.admin',
      description: 'Administrera dummy-modulen',
    },
  ],
};
