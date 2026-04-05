/**
 * View State — Serialization & Deserialization
 *
 * Provides a versioned, portable JSON format for persisting grid view state.
 * This is OUR format — not TanStack's internal state.
 */

import type { GridViewState, GridFilterModel, GridSortModel, GridGroupingModel } from '../public/gridTypes';

/** Versioned wrapper for serialized view state */
export interface SerializedViewState {
  version: 1;
  name?: string;
  state: GridViewState;
  savedAt: string;
}

/** Create a default/empty view state */
export function createDefaultViewState(): GridViewState {
  return {
    columnOrder: [],
    columnWidths: {},
    columnVisibility: {},
    sorting: [],
    filters: [],
    grouping: [],
    expandedGroups: [],
    pinnedColumns: {},
  };
}

/** Serialize view state to a portable JSON structure */
export function serializeViewState(
  state: GridViewState,
  name?: string
): SerializedViewState {
  return {
    version: 1,
    name,
    state: {
      columnOrder: [...state.columnOrder],
      columnWidths: { ...state.columnWidths },
      columnVisibility: { ...state.columnVisibility },
      sorting: state.sorting.map(s => ({ ...s })),
      filters: state.filters.map(f => ({ ...f })),
      grouping: [...state.grouping],
      expandedGroups: [...state.expandedGroups],
      pinnedColumns: { ...state.pinnedColumns },
    },
    savedAt: new Date().toISOString(),
  };
}

/** Deserialize a view state from JSON, with validation */
export function deserializeViewState(
  json: unknown
): GridViewState | null {
  if (!json || typeof json !== 'object') return null;

  const data = json as Record<string, unknown>;
  if (data.version !== 1) return null;

  const state = data.state as Partial<GridViewState> | undefined;
  if (!state) return null;

  return {
    columnOrder: Array.isArray(state.columnOrder) ? state.columnOrder : [],
    columnWidths: (state.columnWidths && typeof state.columnWidths === 'object')
      ? state.columnWidths as Record<string, number> : {},
    columnVisibility: (state.columnVisibility && typeof state.columnVisibility === 'object')
      ? state.columnVisibility as Record<string, boolean> : {},
    sorting: Array.isArray(state.sorting) ? state.sorting as GridSortModel : [],
    filters: Array.isArray(state.filters) ? state.filters as GridFilterModel : [],
    grouping: Array.isArray(state.grouping) ? state.grouping as GridGroupingModel : [],
    expandedGroups: Array.isArray(state.expandedGroups) ? state.expandedGroups : [],
    pinnedColumns: (state.pinnedColumns && typeof state.pinnedColumns === 'object')
      ? state.pinnedColumns as Record<string, 'left' | 'right'> : {},
  };
}

/** Merge a partial view state into a full state (for restoring) */
export function mergeViewState(
  base: GridViewState,
  partial: Partial<GridViewState>
): GridViewState {
  return {
    columnOrder: partial.columnOrder ?? base.columnOrder,
    columnWidths: partial.columnWidths ? { ...base.columnWidths, ...partial.columnWidths } : base.columnWidths,
    columnVisibility: partial.columnVisibility ? { ...base.columnVisibility, ...partial.columnVisibility } : base.columnVisibility,
    sorting: partial.sorting ?? base.sorting,
    filters: partial.filters ?? base.filters,
    grouping: partial.grouping ?? base.grouping,
    expandedGroups: partial.expandedGroups ?? base.expandedGroups,
    pinnedColumns: partial.pinnedColumns ? { ...base.pinnedColumns, ...partial.pinnedColumns } : base.pinnedColumns,
  };
}
