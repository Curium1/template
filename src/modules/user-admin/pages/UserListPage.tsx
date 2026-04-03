import { useState, useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, X, Loader2, UserPlus } from 'lucide-react';
import { ProtectedAction } from '../../../core/authorization/components/ProtectedRoute';
import { usePageHeader } from '../../../core/layout/usePageHeader';
import { useCompanyMembers, useUpdateMemberRole, useRemoveMember } from '../hooks/useCompanyMembers';
import { useCompanyRoles } from '../hooks/useCompanyRoles';
import { useInviteUser } from '../hooks/useInviteUser';
import { useUserAdminStore } from '../store/useUserAdminStore';
import { useAuth } from '../../../core/auth/context/AuthContext';
import { DataGrid, type ColDef } from '../../../core/shared/components/DataGrid';
import type { CompanyRole } from '../../../core/company/types';

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

/* ─── Role Cell Renderer ─── */

function RoleCellRenderer({
  data,
  roles,
  onRoleChange,
  isPending,
  currentUserId,
}: {
  data: { id: string; user_id: string; role_id: string; role?: { name: string } };
  roles: CompanyRole[];
  onRoleChange: (memberId: string, roleId: string) => void;
  isPending: boolean;
  currentUserId?: string;
}) {
  const isCurrentUser = data.user_id === currentUserId;
  const currentRole = roles.find(r => r.id === data.role_id);

  if (isCurrentUser) {
    return (
      <span className="text-[13px] font-medium text-muted-foreground">
        {currentRole?.name ?? '—'}
      </span>
    );
  }

  return (
    <select
      value={data.role_id}
      onChange={e => onRoleChange(data.id, e.target.value)}
      disabled={isPending}
      className="appearance-none bg-secondary/60 text-foreground text-[12px] font-medium pl-2 pr-5 py-0.5 rounded-md border-0 leading-tight focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50 cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
      }}
    >
      {roles.map(r => (
        <option key={r.id} value={r.id}>{r.name}</option>
      ))}
    </select>
  );
}

/* ─── Delete Confirmation ─── */

function RemoveConfirm({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-xl p-6 text-center">
        <h3 className="text-[17px] font-semibold text-foreground mb-2">Ta bort medlem?</h3>
        <p className="text-[14px] text-muted-foreground mb-6">
          Medlemmen förlorar åtkomst till företaget.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04]">
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-[14px] font-medium hover:bg-destructive/90 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Ta bort
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MemberRow = any;

export function UserListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: members, isLoading } = useCompanyMembers();
  const { data: roles } = useCompanyRoles();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const { isInviting, openInvite, closeInvite } = useUserAdminStore();
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  const columnDefs = useMemo<ColDef<MemberRow>[]>(() => [
    {
      headerName: t('modules.user_admin.displayName', 'Namn'),
      field: 'user_profile.display_name',
      flex: 3,
      minWidth: 160,
      valueGetter: (params) => {
        const name = params.data?.user_profile?.display_name;
        return name || '—';
      },
      cellRenderer: (params: { data: MemberRow; value: string }) => {
        const isCurrentUser = params.data?.user_id === user?.id;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-foreground">{params.value}</span>
            {isCurrentUser && (
              <span className="text-[10px] text-muted-foreground">(du)</span>
            )}
          </div>
        );
      },
    },
    {
      headerName: t('modules.user_admin.role', 'Roll'),
      field: 'role_id',
      flex: 2,
      minWidth: 140,
      cellRenderer: (params: { data: MemberRow }) => {
        if (!roles) return <span className="text-muted-foreground">—</span>;
        return (
          <ProtectedAction
            permission="user_admin.edit_roles"
            fallback={
              <span className="text-[13px] font-medium text-muted-foreground">
                {params.data?.role?.name ?? '—'}
              </span>
            }
          >
            <RoleCellRenderer
              data={params.data}
              roles={roles}
              onRoleChange={(memberId, roleId) => updateRole.mutate({ memberId, roleId })}
              isPending={updateRole.isPending}
              currentUserId={user?.id}
            />
          </ProtectedAction>
        );
      },
      sortable: false,
    },
    {
      headerName: t('modules.user_admin.joined', 'Tillagd'),
      field: 'created_at',
      flex: 2,
      minWidth: 100,
      valueFormatter: (params) => {
        if (!params.value) return '—';
        return new Date(params.value).toLocaleDateString('sv-SE');
      },
    },
    {
      headerName: '',
      field: 'id',
      width: 48,
      maxWidth: 48,
      minWidth: 48,
      sortable: false,
      resizable: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
      cellRenderer: (params: { data: MemberRow }) => {
        const isCurrentUser = params.data?.user_id === user?.id;
        if (isCurrentUser) return null;
        return (
          <ProtectedAction permission="user_admin.edit_roles">
            <button
              onClick={() => setRemovingId(params.data.id)}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/[0.06] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </ProtectedAction>
        );
      },
    },
  ], [t, user?.id, roles, updateRole, removeMember]);

  return (
    <>
      <div className="space-y-4">

        {/* AG Grid Members Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !members?.length ? (
          <div className="text-center py-20">
            <p className="text-[14px] text-muted-foreground">Inga medlemmar.</p>
          </div>
        ) : (
          <DataGrid<MemberRow>
            rowData={members}
            columnDefs={columnDefs}
            height="auto"
            rowHeight={40}
            headerHeight={36}
          />
        )}
      </div>

      {/* Modals */}
      {isInviting && roles && <InviteModal roles={roles} onClose={closeInvite} />}
      {removingId && (
        <RemoveConfirm
          isPending={removeMember.isPending}
          onCancel={() => setRemovingId(null)}
          onConfirm={async () => {
            await removeMember.mutateAsync(removingId);
            setRemovingId(null);
          }}
        />
      )}
    </>
  );
}
