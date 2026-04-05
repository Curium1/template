/**
 * Column Adapter
 *
 * Translates our GridColumn[] → TanStack ColumnDef[].
 * This is the ONLY place where our column schema touches TanStack types.
 */

import type { ColumnDef, AggregationFn as TSAggFn } from '@tanstack/react-table';
import type { GridColumn } from '../public/gridTypes';
import { getAggregation } from '../core/aggregation';

/** Metadata attached to each TanStack column for reverse lookups */
export interface ColumnMeta<TData> {
  /** Our original column definition */
  gridColumn: GridColumn<TData>;
  /** Resolved header label (string, not function) */
  label: string;
}

/**
 * Convert our column definitions to TanStack column definitions.
 */
export function adaptColumns<TData>(
  columns: GridColumn<TData>[]
): ColumnDef<TData, unknown>[] {
  return columns.map(col => adaptSingleColumn(col));
}

function adaptSingleColumn<TData>(
  col: GridColumn<TData>
): ColumnDef<TData, unknown> {
  const def: ColumnDef<TData, unknown> = {
    id: col.id,
    header: () => col.headerRenderer ? col.headerRenderer() : col.headerName,
    meta: {
      gridColumn: col,
      label: col.headerName,
    } as ColumnMeta<TData>,
    enableSorting: col.sortable !== false,
    enableColumnFilter: col.filterable !== false,
    enableGrouping: col.groupable !== false,
    enableHiding: col.id !== 'actions',
    enableResizing: true,
    size: col.width ?? 150,
    minSize: col.minWidth ?? 60,
    maxSize: col.maxWidth ?? 800,
  };

  // Accessor: field or valueGetter
  if (col.valueGetter) {
    (def as Record<string, unknown>).accessorFn = (row: TData) => col.valueGetter!(row);
  } else if (col.field) {
    (def as Record<string, unknown>).accessorFn = (row: TData) => {
      // Support nested field paths like 'user.name'
      const parts = col.field!.split('.');
      let val: unknown = row;
      for (const part of parts) {
        if (val == null) return undefined;
        val = (val as Record<string, unknown>)[part];
      }
      return val;
    };
  }

  // Cell renderer
  if (col.cellRenderer) {
    def.cell = (info) => {
      return col.cellRenderer!({
        value: info.getValue(),
        row: info.row.original,
        rowIndex: info.row.index,
        columnId: col.id,
        isGrouped: info.row.getIsGrouped(),
        isEditing: false,
      });
    };
  } else if (col.valueFormatter) {
    const formatter = col.valueFormatter;
    def.cell = (info) => formatter(info.getValue(), info.row.original);
  }

  // Aggregation
  if (col.aggregation) {
    const aggDef = getAggregation(col.aggregation);
    if (aggDef) {
      const tsAgg: TSAggFn<TData, unknown> = (_columnId, _leafRows, childRows) => {
        const values = childRows.map(r => r.getValue(col.id));
        return aggDef.fn(values);
      };
      def.aggregationFn = tsAgg;
      def.aggregatedCell = (info) => {
        const val = info.getValue();
        if (val == null) return null;
        // Format aggregated values
        if (col.aggregation === 'sum' || col.aggregation === 'avg' ||
            col.aggregation === 'min' || col.aggregation === 'max') {
          const num = Number(val);
          if (!Number.isNaN(num)) {
            return new Intl.NumberFormat('sv-SE', {
              maximumFractionDigits: 2,
            }).format(num);
          }
        }
        return String(val);
      };
    }
  }

  // Pinning
  if (col.pinned) {
    // Handled by table state, not column def
  }

  return def;
}

/**
 * Extract our GridColumn from a TanStack column's meta.
 */
export function getGridColumn<TData>(
  meta: unknown
): GridColumn<TData> | undefined {
  if (meta && typeof meta === 'object' && 'gridColumn' in meta) {
    return (meta as ColumnMeta<TData>).gridColumn;
  }
  return undefined;
}

/**
 * Get label string from column meta.
 */
export function getColumnLabel(meta: unknown): string {
  if (meta && typeof meta === 'object' && 'label' in meta) {
    return (meta as ColumnMeta<unknown>).label;
  }
  return '';
}
