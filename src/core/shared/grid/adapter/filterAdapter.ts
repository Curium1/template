/**
 * Filter Adapter
 *
 * Creates TanStack-compatible filterFn from our filter operator registry.
 * Bridges GridFilterItem → TanStack column filter behavior.
 *
 * Supports two filter value shapes:
 * 1. Operator-based: { operator: string, value?, value2? }
 * 2. Excel-style value list: { operator: 'in', selectedValues: string[] }
 */

import type { FilterFn, Row } from '@tanstack/react-table';
import { getFilterOperator } from '../core/filterOperators';

interface PackedFilterValue {
  operator: string;
  value: unknown;
  value2?: unknown;
  /** Excel-style selected values list */
  selectedValues?: string[];
}

/**
 * Universal filter function used by all columns.
 * TanStack calls this per-row, per-column.
 */
export const universalFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown
): boolean => {
  if (filterValue == null) return true;

  const packed = filterValue as PackedFilterValue;

  // Handle Excel-style value list filter
  if (packed.selectedValues && Array.isArray(packed.selectedValues)) {
    const cellValue = row.getValue(columnId);
    const cellStr = cellValue == null ? '' : String(cellValue);
    return packed.selectedValues.includes(cellStr);
  }

  if (!packed.operator) return true;

  const op = getFilterOperator(packed.operator);
  if (!op) return true;

  // For zero-input operators (isEmpty, isTrue, etc.), no value check needed
  if (op.inputCount === 0) {
    const cellValue = row.getValue(columnId);
    return op.predicate(cellValue, undefined, undefined);
  }

  // For 'in' operator with array value
  if (packed.operator === 'in' && Array.isArray(packed.value)) {
    const cellValue = row.getValue(columnId);
    const cellStr = cellValue == null ? '' : String(cellValue);
    return (packed.value as string[]).includes(cellStr);
  }

  // Skip if no filter value provided
  if (packed.value == null && packed.value === undefined) return true;
  // Allow empty string for text operators
  if (packed.value === '' && op.inputCount > 0) return true;

  const cellValue = row.getValue(columnId);
  return op.predicate(cellValue, packed.value, packed.value2);
};

/**
 * Global filter function — searches across all visible column values.
 */
export const globalFilterFn: FilterFn<unknown> = <TData>(
  row: Row<TData>,
  _columnId: string,
  filterValue: unknown
): boolean => {
  if (!filterValue || filterValue === '') return true;

  const search = String(filterValue).toLowerCase();
  const cells = row.getAllCells();

  for (const cell of cells) {
    const val = cell.getValue();
    if (val != null && String(val).toLowerCase().includes(search)) {
      return true;
    }
  }
  return false;
};
