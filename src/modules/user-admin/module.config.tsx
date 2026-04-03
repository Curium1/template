import type { ModuleDefinition } from '../../core/modules/types';
import { registerModuleTranslations } from '../../core/shared/i18n/i18n';
import { userAdminPermissions } from './permissions';
import { userAdminNavigation } from './navigation';
import { UserListPage } from './pages/UserListPage';
import { RolesPage } from './pages/RolesPage';
import { userAdminDashboardWidgets } from './dashboard/TeamOverviewWidget';
import { sv } from './i18n/sv';
import { en } from './i18n/en';

// Register module-scoped translations
registerModuleTranslations({ sv, en });

const moduleDefinition: ModuleDefinition = {
  key: 'user_admin',
  name: 'Användare',
  nameKey: 'modules.user_admin.name',
  version: '1.0.0',
  dependsOn: [],
  permissions: userAdminPermissions,
  routes: [
    {
      path: '/',
      element: <UserListPage />,
      requiredPermission: 'user_admin.view',
    },
    {
      path: '/roles',
      element: <RolesPage />,
      requiredPermission: 'user_admin.manage_roles',
    },
  ],
  navigation: userAdminNavigation,
  dashboardWidgets: userAdminDashboardWidgets,
};

export default moduleDefinition;
