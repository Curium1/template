import type { ModuleDefinition } from '../../core/modules/types';
import { registerModuleTranslations } from '../../core/shared/i18n/i18n';
import { dummyPermissions } from './permissions';
import { dummyNavigation } from './navigation';
import { DummyListPage } from './pages/DummyListPage';
import { dummyDashboardWidgets } from './dashboard/DummyStatsWidget';
import { sv } from './i18n/sv';
import { en } from './i18n/en';

// Register module-scoped translations
registerModuleTranslations({ sv, en });

const dummyModule: ModuleDefinition = {
  key: 'dummy',
  name: 'Dummy-modul',
  nameKey: 'modules.dummy.name',
  version: '1.0.0',
  dependsOn: [],
  permissions: dummyPermissions,
  routes: [
    {
      path: '/',
      element: <DummyListPage />,
      requiredPermission: 'dummy.view',
    },
  ],
  navigation: dummyNavigation,
  dashboardWidgets: dummyDashboardWidgets,
};

export default dummyModule;
