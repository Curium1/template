import { useState, useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Loader2, Check, Shield, ChevronRight, ArrowLeft, Save } from 'lucide-react';
import { ProtectedAction } from '../../../core/authorization/components/ProtectedRoute';
import { usePageHeader } from '../../../core/layout/usePageHeader';
import { useCompanyRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useCompanyRoles';
import { moduleRegistry } from '../../../core/modules/moduleRegistry';
import type { CompanyRole } from '../../../core/company/types';

/* ─── Permission Matrix (inline, not modal) ─── */

function PermissionMatrix({
  permissions,
  onChange,
  disabled,
}: {
  permissions: string[];
  onChange: (perms: string[]) => void;
  disabled?: boolean;
}) {
  const modules = moduleRegistry.getAllModules();
  const isWildcard = permissions.includes('*');

  const togglePermission = (key: string) => {
    if (isWildcard || disabled) return;
    if (permissions.includes(key)) {
      onChange(permissions.filter(p => p !== key));
    } else {
      onChange([...permissions, key]);
    }
  };

  const toggleAll = (moduleKey: string) => {
    if (isWildcard || disabled) return;
    const modulePerms = moduleRegistry.getModulePermissions(moduleKey);
    const allSelected = modulePerms.every(p => permissions.includes(p));
    if (allSelected) {
      onChange(permissions.filter(p => !modulePerms.includes(p)));
    } else {
      const newPerms = [...permissions];
      for (const p of modulePerms) {
        if (!newPerms.includes(p)) newPerms.push(p);
      }
      onChange(newPerms);
    }
  };

  if (isWildcard) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-[13px] text-success font-medium flex items-center gap-2">
        <Check className="w-4 h-4" />
        Denna roll har fullständig åtkomst (wildcard).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map(mod => {
        const modPerms = mod.permissions.permissions;
        const allSelected = modPerms.every(p => permissions.includes(p.key));

        return (
          <div key={mod.key} className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => toggleAll(mod.key)}
                disabled={disabled}
                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  allSelected
                    ? 'bg-foreground border-foreground'
                    : 'border-border bg-background'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {allSelected && <Check className="w-3 h-3 text-background" />}
              </button>
              <span className="text-[14px] font-semibold text-foreground">{mod.name}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
              {modPerms.map(perm => {
                const checked = permissions.includes(perm.key);
                return (
                  <label key={perm.key} className={`flex items-center gap-2 group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.key)}
                      disabled={disabled}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-foreground border-foreground'
                          : 'border-border bg-background group-hover:border-foreground/40'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {checked && <Check className="w-2.5 h-2.5 text-background" />}
                    </button>
                    <span className="text-[13px] text-foreground">{perm.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Create Role Modal (minimal — just name + slug) ─── */

function CreateRoleModal({ onClose }: { onClose: (created?: CompanyRole) => void }) {
  const createRole = useCreateRole();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const created = await createRole.mutateAsync({ name, slug: generatedSlug, permissions: [] });
    onClose(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-foreground">Skapa ny roll</h2>
          <button onClick={() => onClose()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">Namn</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              placeholder="T.ex. Säljare"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">Slug (valfritt)</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              placeholder="Genereras från namnet om tom"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04]"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={createRole.isPending || !name.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createRole.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Skapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation ─── */

function DeleteRoleConfirm({
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
        <h3 className="text-[17px] font-semibold text-foreground mb-2">Ta bort roll?</h3>
        <p className="text-[14px] text-muted-foreground mb-6">
          Medlemmar med denna roll förlorar sina behörigheter.
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

/* ─── Role Sidebar Item ─── */

function RoleSidebarItem({
  role,
  isSelected,
  onSelect,
}: {
  role: CompanyRole;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const permCount = role.permissions.includes('*')
    ? '∞'
    : role.permissions.length;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 group ${
        isSelected
          ? 'bg-foreground/[0.07] ring-1 ring-foreground/10'
          : 'hover:bg-foreground/[0.03]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground group-hover:bg-foreground/10'
          }`}>
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[14px] font-medium truncate ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                {role.name}
              </span>
              {role.is_system && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wide shrink-0">
                  System
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground font-mono">{role.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground tabular-nums">{permCount}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground/50'}`} />
        </div>
      </div>
    </button>
  );
}

/* ─── Detail Pane ─── */

function RoleDetailPane({
  role,
  onBack,
  onDelete,
}: {
  role: CompanyRole;
  onBack: () => void;
  onDelete: (id: string) => void;
}) {
  const updateRole = useUpdateRole();
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(role.name);

  // Reset local state when role changes
  const roleId = role.id;
  const [prevRoleId, setPrevRoleId] = useState(roleId);
  if (roleId !== prevRoleId) {
    setPrevRoleId(roleId);
    setPermissions(role.permissions);
    setName(role.name);
    setEditingName(false);
  }

  const hasChanges = useMemo(() => {
    if (name !== role.name) return true;
    if (permissions.length !== role.permissions.length) return true;
    const sorted1 = [...permissions].sort();
    const sorted2 = [...role.permissions].sort();
    return sorted1.some((p, i) => p !== sorted2[i]);
  }, [name, permissions, role.name, role.permissions]);

  const handleSave = async () => {
    const updates: { id: string; name?: string; permissions?: string[] } = { id: role.id };
    if (name !== role.name) updates.name = name;
    const sorted1 = [...permissions].sort();
    const sorted2 = [...role.permissions].sort();
    const permsChanged = sorted1.length !== sorted2.length || sorted1.some((p, i) => p !== sorted2[i]);
    if (permsChanged) updates.permissions = permissions;

    await updateRole.mutateAsync(updates);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Detail Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button — only visible on mobile */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            {editingName && !role.is_system ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                autoFocus
                className="text-[17px] font-semibold text-foreground bg-transparent border-b border-foreground/20 focus:outline-none focus:border-foreground/50 w-full"
              />
            ) : (
              <button
                onClick={() => !role.is_system && setEditingName(true)}
                className={`text-[17px] font-semibold text-foreground text-left flex items-center gap-2 ${!role.is_system ? 'hover:text-foreground/70' : ''}`}
              >
                {name}
                {!role.is_system && <Pencil className="w-3 h-3 text-muted-foreground/50" />}
              </button>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] text-muted-foreground font-mono">{role.slug}</span>
              {role.is_system && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wide">
                  System
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={updateRole.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 disabled:opacity-40 transition-all"
            >
              {updateRole.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Spara
            </button>
          )}
          {!role.is_system && (
            <ProtectedAction permission="user_admin.manage_roles">
              <button
                onClick={() => onDelete(role.id)}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/[0.06] transition-colors"
                title="Ta bort roll"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </ProtectedAction>
          )}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Behörigheter
        </h3>
        <PermissionMatrix
          permissions={permissions}
          onChange={setPermissions}
          disabled={role.is_system && role.permissions.includes('*')}
        />
      </div>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyDetailPane() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <p className="text-[15px] font-medium text-muted-foreground mb-1">Välj en roll</p>
      <p className="text-[13px] text-muted-foreground/60">
        Klicka på en roll i listan för att visa och redigera behörigheter.
      </p>
    </div>
  );
}

/* ─── Main Page ─── */

export function RolesPage() {
  const { t } = useTranslation();
  const { data: roles, isLoading } = useCompanyRoles();
  const deleteRole = useDeleteRole();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // On mobile: when a role is selected, show detail view
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  usePageHeader({
    title: t('modules.user_admin.roles', 'Roller'),
    subtitle: t('modules.user_admin.rolesSubtitle', 'Hantera roller och deras behörigheter.'),
    actions: (
      <ProtectedAction permission="user_admin.manage_roles">
        <button
          onClick={() => setCreatingRole(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90"
        >
          <Plus className="w-4 h-4" />
          {t('modules.user_admin.createRole', 'Skapa roll')}
        </button>
      </ProtectedAction>
    ),
  });

  const selectedRole = useMemo(
    () => roles?.find(r => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  // Auto-select first role on desktop once roles load
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  if (roles?.length && !selectedRoleId && !didAutoSelect) {
    setSelectedRoleId(roles[0].id);
    setDidAutoSelect(true);
  }

  const handleSelectRole = (id: string) => {
    setSelectedRoleId(id);
    setMobileShowDetail(true);
  };

  const handleMobileBack = () => {
    setMobileShowDetail(false);
  };

  const handleRoleCreated = (created?: CompanyRole) => {
    setCreatingRole(false);
    if (created) {
      setSelectedRoleId(created.id);
      setMobileShowDetail(true);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">

        {/* Split Layout */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !roles?.length ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-[15px] font-medium text-muted-foreground mb-1">Inga roller</p>
            <p className="text-[13px] text-muted-foreground/60">Skapa en roll för att komma igång.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex rounded-2xl border border-border/40 bg-card overflow-hidden">
            {/* ── Sidebar: Role List ── */}
            <div
              className={`
                w-full md:w-[320px] md:min-w-[280px] md:max-w-[360px] md:border-r border-border/40
                flex flex-col bg-card
                ${mobileShowDetail ? 'hidden md:flex' : 'flex'}
              `}
            >
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Roller ({roles.length})
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {roles.map(role => (
                  <RoleSidebarItem
                    key={role.id}
                    role={role}
                    isSelected={role.id === selectedRoleId}
                    onSelect={() => handleSelectRole(role.id)}
                  />
                ))}
              </div>
            </div>

            {/* ── Detail Pane ── */}
            <div
              className={`
                flex-1 min-w-0 flex flex-col
                ${!mobileShowDetail ? 'hidden md:flex' : 'flex'}
              `}
            >
              {selectedRole ? (
                <RoleDetailPane
                  role={selectedRole}
                  onBack={handleMobileBack}
                  onDelete={id => setDeletingId(id)}
                />
              ) : (
                <EmptyDetailPane />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {creatingRole && <CreateRoleModal onClose={handleRoleCreated} />}
      {deletingId && (
        <DeleteRoleConfirm
          isPending={deleteRole.isPending}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            await deleteRole.mutateAsync(deletingId);
            if (selectedRoleId === deletingId) {
              setSelectedRoleId(roles?.[0]?.id !== deletingId ? roles?.[0]?.id ?? null : roles?.[1]?.id ?? null);
              setMobileShowDetail(false);
            }
            setDeletingId(null);
          }}
        />
      )}
    </>
  );
}
