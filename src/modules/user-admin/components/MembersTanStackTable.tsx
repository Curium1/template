import { useState, useMemo, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type GroupingState,
  type ExpandedState,
  type ColumnOrderState,
  type Row,
  type Header,
  type Column,
} from '@tanstack/react-table';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  GripVertical,
  Eye,
  EyeOff,
  Columns3,
  Filter,
  X,
  Layers,
  LayoutGrid,
  ChevronRight,
  Trash2,
  Shield,
} from 'lucide-react';

import { useAuth } from '../../../core/auth/context/AuthContext';
import { ProtectedAction } from '../../../core/authorization/components/ProtectedRoute';
import { useCompanyMembers, useUpdateMemberRole, useRemoveMember } from '../hooks/useCompanyMembers';
import { useCompanyRoles } from '../hooks/useCompanyRoles';
import type { CompanyRole } from '../../../core/company/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MemberRow = any;

/* ─── Saved Views ─── */

interface TableView {
  id: string;
  name: string;
  columnOrder: ColumnOrderState;
  columnVisibility: VisibilityState;
  sorting: SortingState;
  grouping: GroupingState;
}

const DEFAULT_VIEWS: TableView[] = [
  { id: 'default', name: 'Standard', columnOrder: [], columnVisibility: {}, sorting: [], grouping: [] },
  { id: 'by-role', name: 'Per roll', columnOrder: [], columnVisibility: {}, sorting: [{ id: 'role', desc: false }], grouping: ['role'] },
];

/* ─── Draggable Header Cell ─── */

function DraggableHeader<TData>({ header }: { header: Header<TData, unknown> }) {
  const { t } = useTranslation();
  const isPinned = header.column.getIsPinned();
  const canSort = header.column.getCanSort();
  const isSorted = header.column.getIsSorted();
  const canGroup = header.column.getCanGroup();
  const isGrouped = header.column.getIsGrouped();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
    disabled: isPinned !== false,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    width: header.getSize(),
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`relative px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide select-none group ${
        isDragging ? 'z-50 bg-card shadow-lg rounded-lg' : ''
      }`}
    >
      <div className="flex items-center gap-1">
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <GripVertical className="w-3 h-3" />
        </span>

        {/* Sort toggle */}
        {canSort ? (
          <button
            onClick={header.column.getToggleSortingHandler()}
            className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors text-muted-foreground"
          >
            <span>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
            {isSorted === 'asc' ? (
              <ChevronUp className="w-3 h-3 text-foreground" />
            ) : isSorted === 'desc' ? (
              <ChevronDown className="w-3 h-3 text-foreground" />
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            )}
          </button>
        ) : (
          <span className="text-muted-foreground">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </span>
        )}

        {/* Group toggle */}
        {canGroup && (
          <button
            onClick={header.column.getToggleGroupingHandler()}
            className={`ml-auto p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
              isGrouped
                ? 'text-foreground bg-foreground/10'
                : 'text-muted-foreground/40 hover:text-muted-foreground'
            }`}
            title={isGrouped ? t('modules.user_admin.tanstack.ungroup', 'Avgruppera') : t('modules.user_admin.tanstack.group', 'Gruppera')}
          >
            <Layers className="w-3 h-3" />
          </button>
        )}
      </div>
    </th>
  );
}

/* ─── Column Filter Input ─── */

function ColumnFilterInput({ column }: { column: Column<MemberRow, unknown> }) {
  const facets = column.getFacetedUniqueValues();
  const filterValue = column.getFilterValue();
  const sortedUniqueValues = useMemo(
    () => Array.from(facets.keys()).sort(),
    [facets]
  );

  if (!column.getCanFilter()) return null;

  return (
    <div className="px-3 py-1.5">
      <select
        value={(filterValue ?? '') as string}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
        className="w-full px-2 py-1 rounded-md border border-border/60 bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
      >
        <option value="">Alla ({facets.size})</option>
        {sortedUniqueValues.map((v) => (
          <option key={String(v)} value={String(v)}>
            {String(v)}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ─── Main Component ─── */

export function MembersTanStackTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: members, isLoading } = useCompanyMembers();
  const { data: roles } = useCompanyRoles();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  // UI state
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [views, setViews] = useState<TableView[]>(DEFAULT_VIEWS);
  const [activeViewId, setActiveViewId] = useState('default');
  const [showViewPicker, setShowViewPicker] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const viewPickerId = useId();

  /* ─── Column definitions ─── */

  // Pre-resolve column labels for toolbar/chips
  const colLabels = useMemo(() => ({
    name: t('modules.user_admin.displayName', 'Namn'),
    email: t('modules.user_admin.email', 'E-post'),
    role: t('modules.user_admin.role', 'Roll'),
    joined: t('modules.user_admin.joined', 'Tillagd'),
  }), [t]);

  const columns = useMemo<ColumnDef<MemberRow>[]>(() => [
    {
      id: 'name',
      accessorFn: (row) => row.user_profile?.display_name || '—',
      header: () => colLabels.name,
      meta: { label: colLabels.name },
      cell: ({ getValue, row }) => {
        const name = getValue<string>();
        const isCurrentUser = row.original.user_id === user?.id;
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground/10 text-foreground text-[10px] font-semibold shrink-0">
              {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[13px] font-medium text-foreground truncate">{name}</span>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 rounded-md bg-foreground/[0.06] text-[10px] font-medium text-muted-foreground shrink-0">{t('modules.user_admin.you', 'du')}</span>
            )}
          </div>
        );
      },
      enableGrouping: false,
      size: 220,
    },
    {
      id: 'email',
      accessorFn: (row) => row.user_profile?.email || row.user_id?.slice(0, 8),
      header: () => colLabels.email,
      meta: { label: colLabels.email },
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground truncate">{getValue<string>()}</span>
      ),
      enableGrouping: false,
      size: 200,
    },
    {
      id: 'role',
      accessorFn: (row) => row.role?.name ?? '—',
      header: () => colLabels.role,
      meta: { label: colLabels.role },
      cell: ({ row }) => {
        const data = row.original;
        const currentRole = roles?.find((r: CompanyRole) => r.id === data.role_id);
        const isCurrentUser = data.user_id === user?.id;

        if (isCurrentUser || !roles) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/[0.06] text-[12px] font-medium text-foreground">
              <Shield className="w-3 h-3 text-muted-foreground" />
              {currentRole?.name ?? '—'}
            </span>
          );
        }

        return (
          <ProtectedAction
            permission="user_admin.edit_roles"
            fallback={
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/[0.06] text-[12px] font-medium text-foreground">
                <Shield className="w-3 h-3 text-muted-foreground" />
                {currentRole?.name ?? '—'}
              </span>
            }
          >
            <select
              value={data.role_id}
              onChange={e => updateRole.mutate({ memberId: data.id, roleId: e.target.value })}
              disabled={updateRole.isPending}
              className="appearance-none bg-foreground/[0.06] text-foreground text-[12px] font-medium px-2 py-0.5 pr-5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 4px center',
              }}
            >
              {roles.map((r: CompanyRole) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </ProtectedAction>
        );
      },
      filterFn: 'equalsString',
      size: 160,
    },
    {
      id: 'joined',
      accessorFn: (row) => row.created_at,
      header: () => colLabels.joined,
      meta: { label: colLabels.joined },
      cell: ({ getValue }) => {
        const value = getValue<string>();
        if (!value) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-[13px] text-muted-foreground tabular-nums">
            {new Date(value).toLocaleDateString('sv-SE')}
          </span>
        );
      },
      enableGrouping: false,
      size: 120,
    },
    {
      id: 'actions',
      header: () => '',
      enableSorting: false,
      enableGrouping: false,
      enableColumnFilter: false,
      enableHiding: false,
      size: 48,
      cell: ({ row }) => {
        const data = row.original;
        const isCurrentUser = data.user_id === user?.id;
        if (isCurrentUser) return null;

        return (
          <ProtectedAction permission="user_admin.edit_roles">
            <button
              onClick={() => setRemovingId(data.id)}
              className="p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/[0.08] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </ProtectedAction>
        );
      },
    },
  ], [colLabels, user?.id, roles, updateRole, removeMember]);

  /* ─── Flat data for the table ─── */
  const data = useMemo(() => members ?? [], [members]);

  /* ─── Table instance ─── */

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      grouping,
      expanded,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableGrouping: true,
  });

  /* ─── DnD sensors ─── */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const allColumns = table.getAllLeafColumns().map(c => c.id);
      const currentOrder = columnOrder.length ? columnOrder : allColumns;
      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);
      setColumnOrder(arrayMove(currentOrder, oldIndex, newIndex));
    },
    [columnOrder, table]
  );

  /* ─── View management ─── */

  const applyView = useCallback((view: TableView) => {
    setActiveViewId(view.id);
    setSorting(view.sorting);
    setGrouping(view.grouping);
    setColumnVisibility(view.columnVisibility);
    if (view.columnOrder.length) setColumnOrder(view.columnOrder);
    setShowViewPicker(false);
  }, []);

  const saveCurrentView = useCallback(() => {
    const name = prompt(t('modules.user_admin.tanstack.viewName', 'Vy-namn:'));
    if (!name) return;
    const newView: TableView = {
      id: `custom-${Date.now()}`,
      name,
      columnOrder,
      columnVisibility,
      sorting,
      grouping,
    };
    setViews(prev => [...prev, newView]);
    setActiveViewId(newView.id);
  }, [columnOrder, columnVisibility, sorting, grouping, t]);

  /* ─── Render ─── */

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const allColumns = table.getAllLeafColumns();
  const columnIds = allColumns.map(c => c.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/40">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={t('modules.user_admin.tanstack.search', 'Sök medlemmar...')}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/60 bg-background text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* View picker */}
        <div className="relative">
          <button
            onClick={() => setShowViewPicker(!showViewPicker)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
              showViewPicker
                ? 'border-foreground/20 bg-foreground/[0.06] text-foreground'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {views.find(v => v.id === activeViewId)?.name ?? 'Standard'}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showViewPicker && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border/60 rounded-xl shadow-lg z-50 py-1">
              {views.map(view => (
                <button
                  key={view.id}
                  onClick={() => applyView(view)}
                  className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                    view.id === activeViewId
                      ? 'bg-foreground/[0.06] text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]'
                  }`}
                >
                  {view.name}
                </button>
              ))}
              <div className="border-t border-border/40 mt-1 pt-1">
                <button
                  onClick={saveCurrentView}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]"
                >
                  + {t('modules.user_admin.tanstack.saveView', 'Spara vy')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Column visibility toggle */}
        <button
          onClick={() => { setShowColumnPanel(!showColumnPanel); setShowFilterPanel(false); }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
            showColumnPanel
              ? 'border-foreground/20 bg-foreground/[0.06] text-foreground'
              : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
          {t('modules.user_admin.tanstack.columns', 'Kolumner')}
        </button>

        {/* Filter toggle */}
        <button
          onClick={() => { setShowFilterPanel(!showFilterPanel); setShowColumnPanel(false); }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
            showFilterPanel || columnFilters.length > 0
              ? 'border-foreground/20 bg-foreground/[0.06] text-foreground'
              : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {t('modules.user_admin.tanstack.filter', 'Filter')}
          {columnFilters.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-foreground text-background text-[10px] font-semibold leading-none">
              {columnFilters.length}
            </span>
          )}
        </button>

        {/* Active filters / grouping chips */}
        {(columnFilters.length > 0 || grouping.length > 0) && (
          <div className="flex items-center gap-1.5 ml-auto">
            {grouping.map(gId => (
              <span key={gId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-foreground/[0.06] text-[11px] font-medium text-foreground">
                <Layers className="w-3 h-3" />
                {(allColumns.find(c => c.id === gId)?.columnDef.meta as { label?: string })?.label ?? gId}
                <button onClick={() => setGrouping(g => g.filter(id => id !== gId))} className="ml-0.5 hover:text-destructive">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {columnFilters.map(f => (
              <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-foreground/[0.06] text-[11px] font-medium text-foreground">
                <Filter className="w-3 h-3" />
                {String(f.value)}
                <button onClick={() => setColumnFilters(prev => prev.filter(cf => cf.id !== f.id))} className="ml-0.5 hover:text-destructive">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Row count */}
        <span className="text-[11px] text-muted-foreground/60 tabular-nums ml-auto shrink-0">
          {rows.length} {t('modules.user_admin.tanstack.rows', 'rader')}
        </span>
      </div>

      {/* ─── Column Visibility Panel ─── */}
      {showColumnPanel && (
        <div className="px-4 py-2.5 border-b border-border/40 flex flex-wrap gap-2">
          {allColumns
            .filter(col => col.getCanHide())
            .map(col => (
              <button
                key={col.id}
                onClick={col.getToggleVisibilityHandler()}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                  col.getIsVisible()
                    ? 'border-foreground/20 bg-foreground/[0.06] text-foreground'
                    : 'border-border/40 text-muted-foreground/50 line-through'
                }`}
              >
                {col.getIsVisible() ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {(col.columnDef.meta as { label?: string })?.label ?? col.id}
              </button>
            ))}
        </div>
      )}

      {/* ─── Filter Panel ─── */}
      {showFilterPanel && (
        <div className="px-4 py-2.5 border-b border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allColumns
            .filter(col => col.getCanFilter())
            .map(col => (
              <div key={col.id}>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1 px-1">
                  {(col.columnDef.meta as { label?: string })?.label ?? col.id}
                </label>
                <ColumnFilterInput column={col} />
              </div>
            ))}
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full">
            <thead>
              {headerGroups.map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-border/40">
                  <SortableContext
                    items={columnIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map(header => (
                      <DraggableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
                </tr>
              ))}
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length} className="text-center py-16 text-[14px] text-muted-foreground">
                    {globalFilter
                      ? t('modules.user_admin.tanstack.noResults', 'Inga träffar.')
                      : t('modules.user_admin.tanstack.noMembers', 'Inga medlemmar.')}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-border/20 last:border-0 hover:bg-foreground/[0.015] transition-colors"
                  >
                    {row.getVisibleCells().map(cell => {
                      const isGrouped = cell.getIsGrouped();
                      const isAggregated = cell.getIsAggregated();
                      const isPlaceholder = cell.getIsPlaceholder();

                      return (
                        <td
                          key={cell.id}
                          className="px-3 py-2.5"
                          style={{ width: cell.column.getSize() }}
                        >
                          {isGrouped ? (
                            <button
                              onClick={row.getToggleExpandedHandler()}
                              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground cursor-pointer"
                            >
                              {row.getIsExpanded() ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-foreground/10 text-[10px] font-semibold">
                                {row.subRows.length}
                              </span>
                            </button>
                          ) : isAggregated ? (
                            flexRender(
                              cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          ) : isPlaceholder ? null : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 text-[11px] text-muted-foreground/60">
        <span>
          TanStack Table v8 • {data.length} {t('modules.user_admin.tanstack.total', 'totalt')}
          {table.getFilteredRowModel().rows.length !== data.length && (
            <> • {table.getFilteredRowModel().rows.length} {t('modules.user_admin.tanstack.filtered', 'filtrerade')}</>
          )}
        </span>
        <span className="tabular-nums">
          {allColumns.filter(c => c.getIsVisible()).length}/{allColumns.length} {t('modules.user_admin.tanstack.columnsVisible', 'kolumner synliga')}
        </span>
      </div>

      {/* Remove confirmation */}
      {removingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-xl p-6 text-center">
            <h3 className="text-[17px] font-semibold text-foreground mb-2">
              {t('modules.user_admin.tanstack.removeConfirm', 'Ta bort medlem?')}
            </h3>
            <p className="text-[14px] text-muted-foreground mb-6">
              {t('modules.user_admin.tanstack.removeDescription', 'Medlemmen förlorar åtkomst till företaget.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemovingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-[14px] font-medium text-foreground hover:bg-foreground/[0.04]"
              >
                {t('modules.user_admin.tanstack.cancel', 'Avbryt')}
              </button>
              <button
                onClick={async () => {
                  await removeMember.mutateAsync(removingId);
                  setRemovingId(null);
                }}
                disabled={removeMember.isPending}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-[14px] font-medium hover:bg-destructive/90 disabled:opacity-40"
              >
                {t('modules.user_admin.tanstack.remove', 'Ta bort')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
