import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, UserPlus } from 'lucide-react';
import { ProtectedAction } from '../../authorization/components/ProtectedRoute';
import { usePageHeader } from '../../layout/usePageHeader';
import { useCompanyRoles } from '../hooks/useCompanyRoles';
import { useInviteUser } from '../hooks/useInviteUser';
import { useUserAdminStore } from '../store/useUserAdminStore';
import { MembersTanStackTable } from '../components/MembersTanStackTable';
import type { CompanyRole } from '../../company/types';

/* ─── Invite Modal ─── */

function InviteModal({
  roles,
  onClose,
}: {
  roles: CompanyRole[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const invite = useInviteUser();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleId, setRoleId] = useState(roles.find(r => r.slug === 'user')?.id ?? roles[0]?.id ?? '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await invite.mutateAsync({ email, role_id: roleId, display_name: displayName });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-semibold text-foreground">
            {t('modules.user_admin.invite', 'Bjud in användare')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">
              {t('auth.email', 'E-post')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              placeholder="namn@företag.se"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">
              {t('modules.user_admin.displayName', 'Namn')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              placeholder="Förnamn Efternamn"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">
              {t('modules.user_admin.role', 'Roll')}
            </label>
            <select
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {invite.error && (
            <p className="text-[13px] text-destructive">
              {(invite.error as Error).message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04]"
            >
              {t('modules.dummy.cancel', 'Avbryt')}
            </button>
            <button
              type="submit"
              disabled={invite.isPending || !email.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {invite.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('modules.user_admin.sendInvite', 'Skicka inbjudan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export function UserListPage() {
  const { t } = useTranslation();
  const { data: roles } = useCompanyRoles();

  const { isInviting, openInvite, closeInvite } = useUserAdminStore();

  usePageHeader({
    title: t('modules.user_admin.members', 'Medlemmar'),
    subtitle: t('modules.user_admin.membersSubtitle', 'Hantera användare och deras roller.'),
    actions: (
      <ProtectedAction permission="user_admin.invite">
        <button
          onClick={openInvite}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90"
        >
          <UserPlus className="w-4 h-4" />
          {t('modules.user_admin.invite', 'Bjud in')}
        </button>
      </ProtectedAction>
    ),
  });

  return (
    <>
      <MembersTanStackTable />

      {/* Modals */}
      {isInviting && roles && <InviteModal roles={roles} onClose={closeInvite} />}
    </>
  );
}
