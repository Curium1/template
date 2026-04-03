import type { NavigationItem } from '../../core/modules/types';

/**
 * Navigation configuration for the Dummy module.
 * Kept in a separate file like permissions.ts for clean separation.
 */
export const dummyNavigation: NavigationItem[] = [
  {
    label: 'Dummy',
    labelKey: 'modules.dummy.nav',
    icon: 'box',
    path: '/dummy',
    requiredPermission: 'dummy.view',
    order: 10,
  },
];
