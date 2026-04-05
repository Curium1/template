import { useState, useMemo, useCallback, useRef, useEffect, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  List,
  LayoutGrid,
  Check,
  Play,
  BellOff,
  Trash2,
  ExternalLink,
  CalendarClock,
  LayoutDashboard,
  type LucideIcon,
  GripVertical,
  Loader2,
  Plus,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useNotifications } from '../../notifications';
import { useCompany } from '../../company/context/CompanyContext';
import { usePageHeader } from '../../layout/usePageHeader';
import type { AppNotification, TodoStatus } from '../../notifications/types';
import { TaskCreateModal } from '../components/TaskCreateModal';

const DEFAULT_BRAND_COLOR = '#E53E3E';
const PAGE_SIZE = 20;
const INITIAL_DAYS_AHEAD = 7;
const LOAD_MORE_DAYS = 14;

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const pascalName = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return icons[pascalName] ?? LayoutDashboard;
}

type FilterTab = 'active' | 'completed' | 'muted' | 'all';
type ViewMode = 'list' | 'kanban';

const KANBAN_COLUMNS: { status: TodoStatus; labelKey: string; fallback: string; color: string }[] = [
  { status: 'new', labelKey: 'modules.todo.new', fallback: 'Ny', color: '#3B82F6' },
  { status: 'in_progress', labelKey: 'modules.todo.in_progress', fallback: 'Pågående', color: '#F59E0B' },
  { status: 'done', labelKey: 'modules.todo.done', fallback: 'Klar', color: '#10B981' },
];

/* ── Date window helpers ── */

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isWithinWindow(n: AppNotification, daysAhead: number): boolean {
  const cutoff = daysFromNow(daysAhead);
  const now = new Date();

  // Always include overdue items
  if (n.deadline && n.deadline < now) return true;

  // Include items with deadline within the window
  if (n.deadline && n.deadline <= cutoff) return true;

  // Items without deadline: include if created within window
  if (!n.deadline && n.createdAt <= cutoff) return true;

  return false;
}

/* ═══════════════════════
   Status Badge
   ═══════════════════════ */

function StatusBadge({ status, muted }: { status: TodoStatus; muted: boolean }) {
  const { t } = useTranslation();
  if (muted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-muted text-muted-foreground">
        <BellOff className="w-3 h-3" />
        {t('modules.todo.muted', 'Tystad')}
      </span>
    );
  }
  const styles: Record<TodoStatus, string> = {
    new: 'bg-blue-500/10 text-blue-600',
    in_progress: 'bg-amber-500/10 text-amber-600',
    done: 'bg-green-500/10 text-green-600',
  };
  const keys: Record<TodoStatus, string> = {
    new: t('modules.todo.new', 'Ny'),
    in_progress: t('modules.todo.in_progress', 'Pågående'),
    done: t('modules.todo.done', 'Klar'),
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ${styles[status]}`}>
      {keys[status]}
    </span>
  );
}

/* ═══════════════════════
   List View
   ═══════════════════════ */

function TodoListView({
  items,
  brandColor,
  hasMore,
  onLoadMore,
}: {
  items: AppNotification[];
  brandColor: string;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setStatus, mute, dismiss } = useNotifications();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) onLoadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Check className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-[14px]">{t('modules.todo.noResults', 'Inga resultat.')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60">
              <th className="text-left px-5 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide w-10" />
              <th className="text-left px-5 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('modules.todo.title', 'Uppgift')}
              </th>
              <th className="text-left px-5 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                Modul
              </th>
              <th className="text-left px-5 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                Deadline
              </th>
              <th className="text-left px-5 py-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="w-28 px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map(n => {
              const Icon = n.icon ? getIcon(n.icon) : getIcon('bell');
              const isOverdue = n.deadline && n.deadline < new Date() && n.status !== 'done';
              return (
                <tr
                  key={n.id}
                  className={`border-b border-border/40 last:border-0 hover:bg-foreground/[0.02] transition-colors ${
                    n.status === 'done' || n.muted ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}12` }}>
                      <Icon className="w-4 h-4" style={{ color: brandColor }} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className={`text-[14px] font-medium truncate ${n.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {n.title}
                    </p>
                    {n.description && <p className="text-[12px] text-muted-foreground truncate max-w-[300px]">{n.description}</p>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-muted-foreground px-2 py-0.5 rounded-md bg-foreground/[0.04]">
                      {t(n.moduleLabelKey, n.moduleLabel)}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {n.deadline ? (
                      <span className={`text-[13px] flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                        <CalendarClock className="w-3.5 h-3.5" />
                        {n.deadline.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                        {isOverdue && <span className="text-[11px]">({t('modules.todo.overdue', 'Försenad')})</span>}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={n.status} muted={n.muted} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => navigate(n.path)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors" title={t('modules.todo.goToPage')}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      {n.status !== 'done' && !n.muted && (
                        <>
                          {n.status === 'new' && (
                            <button onClick={() => setStatus(n.id, 'in_progress')} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors" title={t('modules.todo.markInProgress')}>
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setStatus(n.id, 'done')} className="p-1.5 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors" title={t('modules.todo.markDone')}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => mute(n.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors" title={t('modules.todo.muteItem')}>
                            <BellOff className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button onClick={() => dismiss(n.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title={t('modules.todo.deleteItem')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
        </div>
      )}
    </>
  );
}

/* ═══════════════════════
   Kanban View
   ═══════════════════════ */

function KanbanView({ items, brandColor }: { items: AppNotification[]; brandColor: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setStatus, mute, dismiss } = useNotifications();
  const [dragOverCol, setDragOverCol] = useState<TodoStatus | null>(null);

  const handleDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: DragEvent, targetStatus: TodoStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) setStatus(id, targetStatus);
    setDragOverCol(null);
  };

  const handleDragOver = (e: DragEvent, status: TodoStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KANBAN_COLUMNS.map(col => {
        const colItems = items.filter(n => n.status === col.status && !n.muted);
        const isOver = dragOverCol === col.status;

        return (
          <div
            key={col.status}
            className={`rounded-2xl border transition-colors duration-150 ${
              isOver ? 'border-foreground/20 bg-foreground/[0.02]' : 'border-border/60 bg-card/50'
            }`}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, col.status)}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-[13px] font-semibold text-foreground">{t(col.labelKey, col.fallback)}</span>
              <span className="ml-auto text-[12px] text-muted-foreground/60">{colItems.length}</span>
            </div>

            <div className="p-2 space-y-2 min-h-[120px]">
              {colItems.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-[12px] text-muted-foreground/40">
                  {t('modules.todo.noItems', 'Inga uppgifter.')}
                </div>
              ) : (
                colItems.map(n => {
                  const Icon = n.icon ? getIcon(n.icon) : getIcon('bell');
                  const isOverdue = n.deadline && n.deadline < new Date() && n.status !== 'done';

                  return (
                    <div
                      key={n.id}
                      draggable
                      onDragStart={e => handleDragStart(e, n.id)}
                      className={`group bg-card border border-border/40 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-border transition-all ${
                        n.status === 'done' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${brandColor}12` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: brandColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium truncate ${n.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {n.title}
                          </p>
                          {n.description && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{n.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-muted-foreground/50 px-1.5 py-0.5 rounded bg-foreground/[0.03]">
                              {t(n.moduleLabelKey, n.moduleLabel)}
                            </span>
                            {n.deadline && (
                              <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? 'text-red-500' : 'text-muted-foreground/50'}`}>
                                <CalendarClock className="w-2.5 h-2.5" />
                                {n.deadline.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {n.priority === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(n.path)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors" title={t('modules.todo.goToPage')}>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        {n.status !== 'done' && (
                          <button onClick={() => setStatus(n.id, 'done')} className="p-1 rounded text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors" title={t('modules.todo.markDone')}>
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => mute(n.id)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors" title={t('modules.todo.muteItem')}>
                          <BellOff className="w-3 h-3" />
                        </button>
                        <button onClick={() => dismiss(n.id)} className="ml-auto p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title={t('modules.todo.deleteItem')}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════
   Main Todo Page
   ═══════════════════════ */

export function TodoPage() {
  const { t } = useTranslation();
  const { notifications } = useNotifications();
  const { activeCompany } = useCompany();
  const brandColor = activeCompany?.brand_color || DEFAULT_BRAND_COLOR;

  const [view, setView] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterTab>('active');
  const [search, setSearch] = useState('');
  const [daysAhead, setDaysAhead] = useState(INITIAL_DAYS_AHEAD);
  const [showCreate, setShowCreate] = useState(false);

  usePageHeader({
    title: t('modules.todo.title', 'Uppgifter'),
    subtitle: t('modules.todo.subtitle', 'Hantera dina notiser och uppgifter.'),
    actions: (
      <button
        onClick={() => setShowCreate(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('modules.todo.createTask', 'Skapa uppgift')}
      </button>
    ),
  });

  // Filter + time-window
  const { visible, totalFiltered, hasMore } = useMemo(() => {
    let items = [...notifications];

    // Tab filter
    switch (filter) {
      case 'active':
        items = items.filter(n => n.status !== 'done' && !n.muted);
        break;
      case 'completed':
        items = items.filter(n => n.status === 'done');
        break;
      case 'muted':
        items = items.filter(n => n.muted);
        break;
      case 'all':
        break;
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.moduleLabel.toLowerCase().includes(q),
      );
    }

    const totalFiltered = items.length;

    // Time window: overdue + next N days (only for active tab without search)
    if (filter === 'active' && !search.trim()) {
      items = items.filter(n => isWithinWindow(n, daysAhead));
    }

    // Sort: overdue first, then by deadline ascending, then by createdAt descending
    items.sort((a, b) => {
      const now = new Date();
      const aOverdue = a.deadline && a.deadline < now ? 1 : 0;
      const bOverdue = b.deadline && b.deadline < now ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      if (a.deadline && b.deadline) return a.deadline.getTime() - b.deadline.getTime();
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const hasMore = filter === 'active' && !search.trim() && items.length < totalFiltered;

    return { visible: items, totalFiltered, hasMore };
  }, [notifications, filter, search, daysAhead]);

  const loadMore = useCallback(() => {
    setDaysAhead(prev => prev + LOAD_MORE_DAYS);
  }, []);

  // Reset window when switching tabs
  useEffect(() => {
    setDaysAhead(INITIAL_DAYS_AHEAD);
  }, [filter]);

  const filterTabs: { key: FilterTab; labelKey: string; fallback: string; count: number }[] = [
    { key: 'active', labelKey: 'modules.todo.active', fallback: 'Aktiva', count: notifications.filter(n => n.status !== 'done' && !n.muted).length },
    { key: 'completed', labelKey: 'modules.todo.completed', fallback: 'Slutförda', count: notifications.filter(n => n.status === 'done').length },
    { key: 'muted', labelKey: 'modules.todo.muted', fallback: 'Tystade', count: notifications.filter(n => n.muted).length },
    { key: 'all', labelKey: 'modules.todo.all', fallback: 'Alla', count: notifications.length },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-0.5 bg-card border border-border/60 rounded-xl p-1">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-foreground/[0.07] text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]'
              }`}
            >
              {t(tab.labelKey, tab.fallback)}
              <span className="text-[11px] text-muted-foreground/60">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('modules.todo.search', 'Sök uppgifter...')}
              className="w-56 pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
            />
          </div>
          <div className="flex items-center bg-card border border-border/60 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-foreground/[0.07] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title={t('modules.todo.listView', 'Lista')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'kanban' ? 'bg-foreground/[0.07] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title={t('modules.todo.kanbanView', 'Kanban')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View */}
      {view === 'list' ? (
        <TodoListView items={visible} brandColor={brandColor} hasMore={hasMore} onLoadMore={loadMore} />
      ) : (
        <KanbanView items={visible} brandColor={brandColor} />
      )}

      {/* Create task modal */}
      {showCreate && <TaskCreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
