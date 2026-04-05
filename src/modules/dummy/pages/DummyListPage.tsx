import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { ProtectedAction } from '../../../core/authorization/components/ProtectedRoute';
import { usePageHeader } from '../../../core/layout/usePageHeader';
import { useDummyItems, useCreateDummy, useUpdateDummy, useDeleteDummy } from '../hooks/useDummyItems';
import { useDummyStore } from '../store/useDummyStore';
import { useNotifications } from '../../../core/notifications';
import { MyDataGrid } from '../../../core/shared/grid';
import type { GridColumn } from '../../../core/shared/grid';
import type { DummyItem } from '../types';

/* ─── Form Modal ─── */

function ItemModal({
  item,
  onClose,
}: {
  item?: DummyItem;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const createMutation = useCreateDummy();
  const updateMutation = useUpdateDummy();

  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(item?.status ?? 'active');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setStatus(item.status);
    }
  }, [item]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (item) {
      await updateMutation.mutateAsync({ id: item.id, title, description, status } as never);
    } else {
      await createMutation.mutateAsync({ title, description, status } as never);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-semibold text-foreground">
            {item ? t('modules.dummy.edit') : t('modules.dummy.create')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">
              {t('modules.dummy.title')}
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              placeholder="Ange titel..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">
              {t('modules.dummy.description')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none"
              placeholder="Valfri beskrivning..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground">
              {t('modules.dummy.status')}
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04]"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-foreground text-background text-[14px] font-medium hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Confirmation ─── */

function DeleteConfirm({
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
        <h3 className="text-[17px] font-semibold text-foreground mb-2">
          Ta bort post?
        </h3>
        <p className="text-[14px] text-muted-foreground mb-6">
          Denna åtgärd kan inte ångras.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04]"
          >
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

/* ─── Main List Page ─── */

export function DummyListPage() {
  const { t } = useTranslation();
  const { data: items, isLoading, error } = useDummyItems();
  const deleteMutation = useDeleteDummy();
  const { isCreating, editingId, openCreate, closeCreate, openEdit, closeEdit } = useDummyStore();
  const { push } = useNotifications();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Demo: push sample notifications (once per mount)
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    push({
      id: 'demo-dummy-1',
      moduleKey: 'dummy',
      moduleLabel: 'Dummy',
      moduleLabelKey: 'modules.dummy.name',
      title: 'Ny post skapad',
      description: 'En testpost har lagts till i systemet.',
      icon: 'box',
      path: '/dummy',
      priority: 'medium',
      createdAt: now,
    });
    push({
      id: 'demo-dummy-2',
      moduleKey: 'dummy',
      moduleLabel: 'Dummy',
      moduleLabelKey: 'modules.dummy.name',
      title: 'Deadline närmar sig',
      description: 'Post "Alpha" förfaller imorgon.',
      icon: 'clock',
      path: '/dummy',
      priority: 'high',
      createdAt: yesterday,
      deadline: tomorrow,
    });
    push({
      id: 'demo-user-1',
      moduleKey: 'user_admin',
      moduleLabel: 'Användare',
      moduleLabelKey: 'modules.user_admin.nav',
      title: 'Ny medlem tillagd',
      description: 'anna@example.com har bjudits in.',
      icon: 'user-plus',
      path: '/user-admin',
      priority: 'low',
      createdAt: yesterday,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePageHeader({
    title: t('modules.dummy.list', 'Dummy-poster'),
    subtitle: t('modules.dummy.listSubtitle', 'Hantera dina poster.'),
    actions: (
      <ProtectedAction permission="dummy.create">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90"
        >
          <Plus className="w-4 h-4" />
          {t('modules.dummy.create')}
        </button>
      </ProtectedAction>
    ),
  });

  const editingItem = editingId ? items?.find(i => i.id === editingId) : undefined;

  // ─── Column definitions (Tier 1: Display) ───
  const columns: GridColumn<DummyItem>[] = useMemo(() => [
    {
      id: 'title',
      field: 'title',
      headerName: t('modules.dummy.title', 'Titel'),
      width: 250,
      filterType: 'text',
    },
    {
      id: 'description',
      field: 'description',
      headerName: t('modules.dummy.description', 'Beskrivning'),
      flex: 2,
      filterType: 'text',
      valueFormatter: (v) => (v as string) || '—',
    },
    {
      id: 'status',
      field: 'status',
      headerName: t('modules.dummy.status', 'Status'),
      width: 120,
      filterType: 'enum',
      filterEnumValues: ['active', 'inactive'],
      cellRenderer: ({ value }) => {
        const s = value as string;
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ${
              s === 'active'
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {s === 'active' ? 'Aktiv' : 'Inaktiv'}
          </span>
        );
      },
    },
  ], [t]);

  if (error) {
    return (
      <div className="text-destructive text-[14px]">
        Fel: {(error as Error).message}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <MyDataGrid<DummyItem>
          rows={items ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          height={400}
          features={{
            sorting: true,
            toolbar: false,
          }}
          statusBar={false}
          emptyMessage="Inga poster ännu."
          rowActions={(row) => (
            <>
              <ProtectedAction permission="dummy.edit">
                <button
                  onClick={() => openEdit(row.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
                  title={t('modules.dummy.edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </ProtectedAction>
              <ProtectedAction permission="dummy.delete">
                <button
                  onClick={() => setDeletingId(row.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/[0.06]"
                  title={t('modules.dummy.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </ProtectedAction>
            </>
          )}
          rowActionsWidth={70}
        />
      </div>

      {/* Modals */}
      {isCreating && <ItemModal onClose={closeCreate} />}
      {editingItem && <ItemModal item={editingItem} onClose={closeEdit} />}
      {deletingId && (
        <DeleteConfirm
          isPending={deleteMutation.isPending}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
          }}
        />
      )}
    </>
  );
}
