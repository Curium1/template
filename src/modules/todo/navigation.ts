import type { NavigationItem } from '../../core/modules/types';

export const todoNavigation: NavigationItem[] = [
  {
    label: 'Uppgifter',
    labelKey: 'modules.todo.nav',
    icon: 'check-square',
    path: '/todo',
    requiredPermission: 'todo.view',
    order: 5,
  },
];
