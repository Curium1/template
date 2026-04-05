import { useTranslation } from 'react-i18next';
import { Users, Shield } from 'lucide-react';
import { useCompanyMembers } from '../hooks/useCompanyMembers';
import { useCompanyRoles } from '../hooks/useCompanyRoles';
import type { DashboardWidget } from '../../modules/types';

/* ─── Team Overview Widget ─── */

function TeamOverviewWidget() {
  const { t } = useTranslation();
  const { data: members, isLoading: membersLoading } = useCompanyMembers();
  const { data: roles, isLoading: rolesLoading } = useCompanyRoles();

  const isLoading = membersLoading || rolesLoading;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            {t('modules.user_admin.members', 'Medlemmar')}
          </p>
          <p className="text-[22px] font-semibold text-foreground tabular-nums">
            {isLoading ? '–' : members?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            {t('modules.user_admin.roles', 'Roller')}
          </p>
          <p className="text-[22px] font-semibold text-foreground tabular-nums">
            {isLoading ? '–' : roles?.length ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Widget Exports ─── */

export const userAdminDashboardWidgets: DashboardWidget[] = [
  {
    key: 'user_admin.team_overview',
    title: 'Team',
    titleKey: 'modules.user_admin.dashboardTeam',
    component: TeamOverviewWidget,
    colSpan: 2,
    order: 10,
    requiredPermission: 'user_admin.view_members',
  },
];
