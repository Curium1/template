/**
 * useGridApi
 *
 * Creates the imperative GridApi handle wired to the table instance.
 */

import { useCallback, useImperativeHandle, type Ref } from 'react';
import type { GridApi } from '../public/gridApi';
import type { GridFilterModel, GridFilterItem, GridSortModel, GridGroupingModel, GridViewState } from '../public/gridTypes';
import type { GridInstance } from './useGridInstance';
import { adaptSortModel, adaptFilterModel, adaptGroupingModel } from '../adapter/stateAdapter';

export function useGridApi<TData>(
  ref: Ref<GridApi<TData>> | undefined,
  instance: GridInstance<TData>,
  rows: TData[],
  rowKey: string
): void {
  const { table, setGlobalFilter, getViewState, restoreViewState } = instance;

  const api: GridApi<TData> = {
    // ── Filtering ──
    setFilters: useCallback((filters: GridFilterModel) => {
      table.setColumnFilters(adaptFilterModel(filters));
    }, [table]),

    addFilter: useCallback((filter: GridFilterItem) => {
      table.setColumnFilters(prev => {
        const adapted = adaptFilterModel([filter]);
        const filtered = prev.filter(f => f.id !== filter.columnId);
        return [...filtered, ...adapted];
      });
    }, [table]),

    removeFilter: useCallback((columnId: string) => {
      table.setColumnFilters(prev => prev.filter(f => f.id !== columnId));
    }, [table]),

    clearFilters: useCallback(() => {
      table.setColumnFilters([]);
      setGlobalFilter('');
    }, [table, setGlobalFilter]),

    getFilters: useCallback(() => {
      return getViewState().filters;
    }, [getViewState]),

    setGlobalFilter: useCallback((value: string) => {
      setGlobalFilter(value);
    }, [setGlobalFilter]),

    // ── Sorting ──
    setSorting: useCallback((sorting: GridSortModel) => {
      table.setSorting(adaptSortModel(sorting));
    }, [table]),

    clearSorting: useCallback(() => {
      table.setSorting([]);
    }, [table]),

    // ── Grouping ──
    setGrouping: useCallback((grouping: GridGroupingModel) => {
      table.setGrouping(adaptGroupingModel(grouping));
    }, [table]),

    clearGrouping: useCallback(() => {
      table.setGrouping([]);
    }, [table]),

    expandAll: useCallback(() => {
      table.toggleAllRowsExpanded(true);
    }, [table]),

    collapseAll: useCallback(() => {
      table.toggleAllRowsExpanded(false);
    }, [table]),

    toggleGroup: useCallback((groupId: string) => {
      const row = table.getRow(groupId);
      if (row) row.toggleExpanded();
    }, [table]),

    // ── Selection ──
    selectRow: useCallback((key: string) => {
      table.setRowSelection(prev => ({ ...prev, [key]: true }));
    }, [table]),

    deselectRow: useCallback((key: string) => {
      table.setRowSelection(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, [table]),

    selectAll: useCallback(() => {
      table.toggleAllRowsSelected(true);
    }, [table]),

    deselectAll: useCallback(() => {
      table.toggleAllRowsSelected(false);
    }, [table]),

    getSelectedRows: useCallback(() => {
      const selectedIds = table.getSelectedRowModel().rows.map(r => r.id);
      return rows.filter(r => {
        const key = String((r as Record<string, unknown>)[rowKey]);
        return selectedIds.includes(key);
      });
    }, [table, rows, rowKey]),

    // ── State ──
    getState: useCallback(() => getViewState(), [getViewState]),
    restoreState: useCallback((state: Partial<GridViewState>) => restoreViewState(state), [restoreViewState]),

    // ── Utilities ──
    getRowCount: useCallback(() => rows.length, [rows]),
    getFilteredRowCount: useCallback(() => table.getFilteredRowModel().rows.length, [table]),

    scrollToRow: useCallback((_key: string) => {
      // Will be implemented with virtualization
    }, []),

    exportCsv: useCallback((filename = 'export.csv') => {
      const visibleColumns = table.getVisibleLeafColumns();
      const headers = visibleColumns.map(c => {
        const meta = c.columnDef.meta as { label?: string } | undefined;
        return meta?.label ?? c.id;
      });

      const csvRows = table.getFilteredRowModel().rows.map(row => {
        return visibleColumns.map(col => {
          const val = row.getValue(col.id);
          const str = val == null ? '' : String(val);
          // Escape CSV
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',');
      });

      const csv = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, [table]),
  };

  useImperativeHandle(ref, () => api, [api]);
}
