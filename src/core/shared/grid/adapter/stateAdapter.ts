/**
 * State Adapter
 *
 * Bidirectional translation between our GridViewState and TanStack internal state.
 */

import type {
  SortingState,
  ColumnFiltersState,
  GroupingState,
  VisibilityState,
  ColumnOrderState,
  ExpandedState,
  ColumnSizingState,
} from '@tanstack/react-table';

import type {
  GridViewState,
  GridSortModel,
  GridFilterModel,
  GridGroupingModel,
} from '../public/gridTypes';

// ─── Our State → TanStack State ───

export function adaptSortModel(sorting: GridSortModel): SortingState {
  return sorting.map(s => ({
    id: s.columnId,
    desc: s.direction === 'desc',
  }));
}

export function adaptGroupingModel(grouping: GridGroupingModel): GroupingState {
  return [...grouping];
}

export function adaptVisibility(
  visibility: Record<string, boolean>
): VisibilityState {
  return { ...visibility };
}

export function adaptColumnOrder(order: string[]): ColumnOrderState {
  return [...order];
}

export function adaptColumnSizing(
  widths: Record<string, number>
): ColumnSizingState {
  return { ...widths };
}

export function adaptExpandedGroups(groups: string[]): ExpandedState {
  if (groups.length === 0) return {};
  const expanded: Record<string, boolean> = {};
  for (const g of groups) {
    expanded[g] = true;
  }
  return expanded;
}

/**
 * Adapt our filter model to TanStack's ColumnFiltersState.
 * TanStack expects [{id, value}] — we pack operator + value into the value object.
 */
export function adaptFilterModel(filters: GridFilterModel): ColumnFiltersState {
  return filters.map(f => ({
    id: f.columnId,
    value: {
      operator: f.operator,
      value: f.value,
      value2: f.value2,
    },
  }));
}

// ─── TanStack State → Our State ───

export function extractSortModel(sorting: SortingState): GridSortModel {
  return sorting.map(s => ({
    columnId: s.id,
    direction: s.desc ? 'desc' : 'asc',
  }));
}

export function extractGroupingModel(grouping: GroupingState): GridGroupingModel {
  return [...grouping];
}

export function extractFilterModel(filters: ColumnFiltersState): GridFilterModel {
  return filters.map(f => {
    const val = f.value as { operator?: string; value?: unknown; value2?: unknown } | undefined;
    return {
      columnId: f.id,
      operator: val?.operator ?? 'contains',
      value: val?.value,
      value2: val?.value2,
    };
  });
}

export function extractVisibility(vis: VisibilityState): Record<string, boolean> {
  return { ...vis };
}

export function extractColumnOrder(order: ColumnOrderState): string[] {
  return [...order];
}

export function extractColumnSizing(sizing: ColumnSizingState): Record<string, number> {
  return { ...sizing };
}

export function extractExpandedGroups(expanded: ExpandedState): string[] {
  if (typeof expanded === 'boolean') return [];
  return Object.entries(expanded)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

/**
 * Build a complete GridViewState from all TanStack state slices.
 */
export function extractViewState(params: {
  sorting: SortingState;
  filters: ColumnFiltersState;
  grouping: GroupingState;
  visibility: VisibilityState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  expanded: ExpandedState;
  pinnedColumns: Record<string, 'left' | 'right'>;
}): GridViewState {
  return {
    sorting: extractSortModel(params.sorting),
    filters: extractFilterModel(params.filters),
    grouping: extractGroupingModel(params.grouping),
    columnVisibility: extractVisibility(params.visibility),
    columnOrder: extractColumnOrder(params.columnOrder),
    columnWidths: extractColumnSizing(params.columnSizing),
    expandedGroups: extractExpandedGroups(params.expanded),
    pinnedColumns: params.pinnedColumns,
  };
}
