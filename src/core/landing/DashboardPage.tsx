import { useTranslation } from 'react-i18next';
import { moduleRegistry } from '../modules/moduleRegistry';
import { useAuthorization } from '../authorization/context/AuthorizationContext';
import { usePageHeader } from '../layout/usePageHeader';

/**
 * Dashboard page — aggregates widgets contributed by all registered modules.
 * Each module can contribute dashboard components via its `dashboardWidgets` config.
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const { can } = useAuthorization();

  usePageHeader({
    title: t('layout.dashboard', 'Översikt'),
    subtitle: 'Välkommen tillbaka.',
  });

  const widgets = moduleRegistry
    .getAllDashboardWidgets()
    .filter(w => !w.requiredPermission || can(w.requiredPermission));

  const colSpanClass = (span?: 1 | 2 | 3) => {
    switch (span) {
      case 3: return 'sm:col-span-3';
      case 2: return 'sm:col-span-2';
      default: return 'sm:col-span-1';
    }
  };

  return (
    <div className="space-y-6">
      {widgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {widgets.map(widget => {
            const Widget = widget.component;
            return (
              <div
                key={widget.key}
                className={`bg-card border border-border/60 rounded-2xl p-6 ${colSpanClass(widget.colSpan)}`}
              >
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  {t(widget.titleKey, widget.title)}
                </p>
                <Widget />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl p-8 text-center">
          <p className="text-[14px] text-muted-foreground">
            Inga dashboard-widgets tillgängliga.
          </p>
        </div>
      )}
    </div>
  );
}
