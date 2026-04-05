/**
 * useGridInstance
 *
 * Creates and manages the TanStack Table instance.
 * This hook is the ONLY place outside the adapter layer that touches TanStack directly.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type GroupingState,
  type ExpandedState,
  type ColumnOrderState,
  type ColumnSizingState,
  type ColumnPinningState,
  type PaginationState,
  type RowSelectionState,
  type Table,
} from '@tanstack/react-table';

import type { MyDataGridProps, GridViewState } from '../public/gridTypes';
import { adaptColumns } from '../adapter/columnAdapter';
import {
  adaptSortModel,
  adaptFilterModel,
  adaptGroupingModel,
  adaptVisibility,
  adaptColumnOrder,
  adaptColumnSizing,
  adaptExpandedGroups,
  extractViewState,
} from '../adapter/stateAdapter';
import { universalFilterFn, globalFilterFn } from '../adapter/filterAdapter';
import { createStateEmitter, type StateChangeSource } from '../adapter/eventAdapter';

export interface GridInstance<TData> {
  table: Table<TData>;
  // Our normalized state
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  pinnedColumns: Record<string, 'left' | 'right'>;
  pinColumn: (colId: string, side: 'left' | 'right' | false) => void;
  // Pagination
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  // State extraction
  getViewState: () => GridViewState;
  // State restoration
  restoreViewState: (state: Partial<GridViewState>) => void;
}

export function useGridInstance<TData>(
  props: MyDataGridProps<TData>
): GridInstance<TData> {
  const {
    rows,
    columns,
    rowKey,
    features = {},
    initialState,
    onStateChange,
  } = props;

  // ─── Adapt columns (memoized) ───
  const tanstackColumns = useMemo(
    () => adaptColumns(columns),
    [columns]
  );

  // ─── Initialize TanStack state from our initialState ───
  const [sorting, setSorting] = useState<SortingState>(
    () => initialState?.sorting ? adaptSortModel(initialState.sorting) : []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    () => initialState?.filters ? adaptFilterModel(initialState.filters) : []
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Merge hidden column defaults with initialState
    const vis: VisibilityState = {};
    columns.forEach(c => { if (c.hidden) vis[c.id] = false; });
    if (initialState?.columnVisibility) Object.assign(vis, adaptVisibility(initialState.columnVisibility));
    return vis;
  });
  const [grouping, setGrouping] = useState<GroupingState>(
    () => initialState?.grouping ? adaptGroupingModel(initialState.grouping) : []
  );
  const [expanded, setExpanded] = useState<ExpandedState>(
    () => initialState?.expandedGroups ? adaptExpandedGroups(initialState.expandedGroups) : {}
  );
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    () => initialState?.columnOrder ? adaptColumnOrder(initialState.columnOrder) : []
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    () => initialState?.columnWidths ? adaptColumnSizing(initialState.columnWidths) : {}
  );
  const [globalFilter, setGlobalFilter] = useState(props.globalFilter ?? '');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: props.pageSize ?? 50,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() => {
    const left: string[] = [];
    const right: string[] = [];
    columns.forEach(c => {
      if (c.pinned === 'left') left.push(c.id);
      else if (c.pinned === 'right') right.push(c.id);
    });
    if (initialState?.pinnedColumns) {
      Object.entries(initialState.pinnedColumns).forEach(([id, side]) => {
        const arr = side === 'left' ? left : right;
        if (!arr.includes(id)) arr.push(id);
      });
    }
    return { left, right };
  });

  // Derive pinnedColumns record from TanStack's columnPinning for view state compat
  const pinnedColumns = useMemo((): Record<string, 'left' | 'right'> => {
    const result: Record<string, 'left' | 'right'> = {};
    (columnPinning.left ?? []).forEach(id => { result[id] = 'left'; });
    (columnPinning.right ?? []).forEach(id => { result[id] = 'right'; });
    return result;
  }, [columnPinning]);


  // Sync controlled globalFilter
  useEffect(() => {
    if (props.globalFilter !== undefined) {
      setGlobalFilter(props.globalFilter);
    }
  }, [props.globalFilter]);

  // ─── State change emitter ───
  const emitterRef = useRef(createStateEmitter(onStateChange));
  useEffect(() => {
    emitterRef.current = createStateEmitter(onStateChange);
    return () => emitterRef.current.destroy();
  }, [onStateChange]);

  const emitChange = useCallback((source: StateChangeSource) => {
    // We'll call this after state updates; use timeout to capture fresh state
    setTimeout(() => {
      const state = extractViewState({
        sorting,
        filters: columnFilters,
        grouping,
        visibility: columnVisibility,
        columnOrder,
        columnSizing,
        expanded,
        pinnedColumns,
      });
      emitterRef.current.emit(state, source);
    }, 0);
  }, [sorting, columnFilters, grouping, columnVisibility, columnOrder, columnSizing, expanded, pinnedColumns]);

  const pinColumn = useCallback((colId: string, side: 'left' | 'right' | false) => {
    setColumnPinning(prev => {
      const left = (prev.left ?? []).filter(id => id !== colId);
      const right = (prev.right ?? []).filter(id => id !== colId);
      if (side === 'left') left.push(colId);
      else if (side === 'right') right.push(colId);
      return { left, right };
    });
    emitChange('column');
  }, [emitChange]);

  // ─── Row ID getter ───
  const getRowId = useCallback(
    (row: TData) => String((row as Record<string, unknown>)[rowKey]),
    [rowKey]
  );

  // ─── Table instance ───
  const table = useReactTable({
    data: rows,
    columns: tanstackColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      grouping,
      expanded,
      columnOrder: columnOrder.length ? columnOrder : undefined,
      columnSizing,
      columnPinning,
      rowSelection,
      ...(features.pagination ? { pagination } : {}),
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      emitChange('sort');
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      emitChange('filter');
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility(updater);
      emitChange('column');
    },
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: (updater) => {
      setGrouping(updater);
      emitChange('group');
    },
    onExpandedChange: (updater) => {
      setExpanded(updater);
      emitChange('expand');
    },
    onColumnOrderChange: (updater) => {
      setColumnOrder(updater);
      emitChange('column');
    },
    onColumnSizingChange: (updater) => {
      setColumnSizing(updater);
      emitChange('resize');
    },
    onColumnPinningChange: (updater) => {
      setColumnPinning(updater);
      emitChange('column');
    },
    enablePinning: true,
    enableRowSelection: !!features.selection,
    enableMultiRowSelection: features.selection === 'multi' || features.selection === true,
    onRowSelectionChange: setRowSelection,
    ...(features.pagination ? {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
      autoResetPageIndex: true,
    } : {}),
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: features.sorting !== false ? getSortedRowModel() : undefined,
    getFilteredRowModel: features.filtering !== false ? getFilteredRowModel() : undefined,
    getGroupedRowModel: features.grouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: features.grouping ? getExpandedRowModel() : undefined,
    getFacetedRowModel: features.filtering !== false ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: features.filtering !== false ? getFacetedUniqueValues() : undefined,
    enableGrouping: !!features.grouping,
    enableSorting: features.sorting !== false,
    enableColumnResizing: features.columnResizing !== false,
    columnResizeMode: 'onChange',
    filterFns: {
      universal: universalFilterFn,
    },
    globalFilterFn: globalFilterFn,
    defaultColumn: {
      filterFn: 'universal' as never,
    },
  });

  // ─── State extraction ───
  const getViewState = useCallback((): GridViewState => {
    return extractViewState({
      sorting,
      filters: columnFilters,
      grouping,
      visibility: columnVisibility,
      columnOrder,
      columnSizing,
      expanded,
      pinnedColumns,
    });
  }, [sorting, columnFilters, grouping, columnVisibility, columnOrder, columnSizing, expanded, pinnedColumns]);

  // ─── State restoration ───
  const restoreViewState = useCallback((state: Partial<GridViewState>) => {
    if (state.sorting) setSorting(adaptSortModel(state.sorting));
    if (state.filters) setColumnFilters(adaptFilterModel(state.filters));
    if (state.grouping) setGrouping(adaptGroupingModel(state.grouping));
    if (state.columnVisibility) setColumnVisibility(adaptVisibility(state.columnVisibility));
    if (state.columnOrder) setColumnOrder(adaptColumnOrder(state.columnOrder));
    if (state.columnWidths) setColumnSizing(adaptColumnSizing(state.columnWidths));
    if (state.expandedGroups) setExpanded(adaptExpandedGroups(state.expandedGroups));
    if (state.pinnedColumns) {
      const left: string[] = [];
      const right: string[] = [];
      Object.entries(state.pinnedColumns).forEach(([id, side]) => {
        if (side === 'left') left.push(id);
        else if (side === 'right') right.push(id);
      });
      setColumnPinning({ left, right });
    }
    emitChange('restore');
  }, [emitChange]);

  return {
    table,
    globalFilter,
    setGlobalFilter,
    pinnedColumns,
    pinColumn,
    pagination,
    setPagination,
    getViewState,
    restoreViewState,
  };
}
