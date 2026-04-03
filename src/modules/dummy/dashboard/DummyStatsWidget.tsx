import { useTranslation } from 'react-i18next';
import { Box } from 'lucide-react';
import type { DashboardWidget } from '../../../core/modules/types';

function DummyStatsWidget() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
        <Box className="w-5 h-5 text-amber-500" />
      </div>
      <div>
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
          {t('modules.dummy.items', 'Objekt')}
        </p>
        <p className="text-[22px] font-semibold text-foreground tabular-nums">
          0
        </p>
      </div>
    </div>
  );
}

export const dummyDashboardWidgets: DashboardWidget[] = [
  {
    key: 'dummy.stats',
    title: 'Dummy-objekt',
    titleKey: 'modules.dummy.dashboardStats',
    component: DummyStatsWidget,
    colSpan: 1,
    order: 50,
    requiredPermission: 'dummy.view',
  },
];
