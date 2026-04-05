/**
 * MyDataGrid — Public Barrel Export
 *
 * This is the only import path for consuming modules.
 * ONLY public types and the main component are exported.
 * No TanStack types, no adapter internals, no hooks.
 */

export { MyDataGrid } from './public/MyDataGrid';

// ── Public types ──
export type {
  MyDataGridProps,
  GridColumn,
  GridFilterModel,
  GridFilterItem,
  GridSortModel,
  GridSortItem,
  GridGroupingModel,
  GridSelectionModel,
  GridViewState,
  GridFeatures,
  GridSavedView,
  GridStateChangeEvent,
  CellRendererProps,
  FilterRendererProps,
} from './public/gridTypes';

export type { GridApi } from './public/gridApi';

// ── Filter operator utilities (for custom operators) ──
export {
  registerFilterOperator,
  getOperatorsForType,
  getDefaultOperator,
} from './core/filterOperators';
export type { FilterOperator, FilterColumnType } from './core/filterOperators';

// ── View state utilities ──
export {
  serializeViewState,
  deserializeViewState,
  createDefaultViewState,
} from './core/viewState';
