import type { ModuleDefinition } from '../../core/modules/types';
import { registerModuleTranslations } from '../../core/shared/i18n/i18n';
import { gridDemoPermissions } from './permissions';
import { gridDemoNavigation } from './navigation';
import { DemoPage } from './pages/DemoPage';
import { sv } from './i18n/sv';
import { en } from './i18n/en';

// Register module-scoped translations
registerModuleTranslations({ sv, en });

const gridDemoModule: ModuleDefinition = {
  key: 'grid_demo',
  name: 'DataGrid',
  nameKey: 'modules.grid_demo.name',
  version: '1.0.0',
  dependsOn: [],
  permissions: gridDemoPermissions,
  routes: [
    {
      path: '/',
      element: <DemoPage />,
      requiredPermission: 'grid_demo.view',
    },
  ],
  navigation: gridDemoNavigation,
};

export default gridDemoModule;
