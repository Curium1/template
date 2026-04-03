import type { PermissionManifest } from '../../core/modules/types';

export const userAdminPermissions: PermissionManifest = {
  moduleKey: 'user_admin',
  permissions: [
    {
      key: 'user_admin.view',
      name: 'Visa användare',
      nameKey: 'modules.user_admin.permissions.view',
      description: 'Visa medlemmar i företaget',
    },
    {
      key: 'user_admin.invite',
      name: 'Bjud in användare',
      nameKey: 'modules.user_admin.permissions.invite',
      description: 'Bjud in nya användare till företaget',
    },
    {
      key: 'user_admin.edit_roles',
      name: 'Redigera roller',
      nameKey: 'modules.user_admin.permissions.edit_roles',
      description: 'Ändra roller och behörigheter för medlemmar',
    },
    {
      key: 'user_admin.manage_roles',
      name: 'Hantera roller',
      nameKey: 'modules.user_admin.permissions.manage_roles',
      description: 'Skapa, redigera och ta bort roller i företaget',
    },
  ],
};
