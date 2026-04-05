import type { NavigationItem } from '../modules/types';

/**
 * Navigation configuration for the User Administration module.
 * Uses children to create submenus like Cyvra-style expandable groups.
 */
export const userAdminNavigation: NavigationItem[] = [
  {
    label: 'Användare',
    labelKey: 'modules.user_admin.nav',
    icon: 'users',
    path: '/user-admin',
    requiredPermission: 'user_admin.view',
    order: 90,
    children: [
      {
        label: 'Medlemmar',
        labelKey: 'modules.user_admin.members',
        icon: 'user',
        path: '/user-admin',
        requiredPermission: 'user_admin.view',
      },
      {
        label: 'Roller',
        labelKey: 'modules.user_admin.roles',
        icon: 'shield',
        path: '/user-admin/roles',
        requiredPermission: 'user_admin.manage_roles',
      },
    ],
  },
];
