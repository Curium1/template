import type { ModuleDefinition } from '../modules/types';
import { registerModuleTranslations } from '../shared/i18n/i18n';
import { todoPermissions } from './permissions';
import { todoNavigation } from './navigation';
import { TodoPage } from './pages/TodoPage';
import { sv } from './i18n/sv';
import { en } from './i18n/en';

registerModuleTranslations({ sv, en });

const todoModule: ModuleDefinition = {
  key: 'todo',
  name: 'Uppgifter',
  nameKey: 'modules.todo.name',
  version: '1.0.0',
  dependsOn: [],
  permissions: todoPermissions,
  routes: [
    {
      path: '/',
      element: <TodoPage />,
      requiredPermission: 'todo.view',
    },
  ],
  navigation: todoNavigation,
};

export default todoModule;
