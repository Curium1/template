/**
 * GridApi — Imperative API
 *
 * Consumer-facing imperative handle for controlling the grid programmatically.
 * Exposed via React ref on <MyDataGrid />.
 */

import type { GridFilterModel, GridFilterItem, GridSortModel, GridGroupingModel, GridViewState } from './gridTypes';

export interface GridApi<TData = unknown> {
  // ── Filtering ──
  setFilters(filters: GridFilterModel): void;
  addFilter(filter: GridFilterItem): void;
  removeFilter(columnId: string): void;
  clearFilters(): void;
  getFilters(): GridFilterModel;
  setGlobalFilter(value: string): void;

  // ── Sorting ──
  setSorting(sorting: GridSortModel): void;
  clearSorting(): void;

  // ── Grouping ──
  setGrouping(grouping: GridGroupingModel): void;
  clearGrouping(): void;
  expandAll(): void;
  collapseAll(): void;
  toggleGroup(groupId: string): void;

  // ── Selection ──
  selectRow(key: string): void;
  deselectRow(key: string): void;
  selectAll(): void;
  deselectAll(): void;
  getSelectedRows(): TData[];

  // ── State Persistence ──
  getState(): GridViewState;
  restoreState(state: Partial<GridViewState>): void;

  // ── Utilities ──
  getRowCount(): number;
  getFilteredRowCount(): number;
  scrollToRow(key: string): void;
  exportCsv(filename?: string): void;
}
