/**
 * MyDataGrid — Main Public Component
 *
 * This is the ONLY component modules import.
 * TanStack Table is an internal implementation detail.
 */

import { forwardRef, type Ref } from 'react';
import type { MyDataGridProps } from './gridTypes';
import type { GridApi } from './gridApi';
import { useGridInstance } from '../hooks/useGridInstance';
import { useGridApi } from '../hooks/useGridApi';
import { GridShell } from '../rendering/GridShell';

function MyDataGridInner<TData>(
  props: MyDataGridProps<TData>,
  ref: Ref<GridApi<TData>>
) {
  const instance = useGridInstance(props);
  useGridApi(ref, instance, props.rows, props.rowKey);

  return (
    <GridShell
      table={instance.table}
      instance={instance}
      props={props}
    />
  );
}

/**
 * Production-ready data grid powered by TanStack Table internally.
 *
 * @example
 * ```tsx
 * import { MyDataGrid } from '../core/shared/grid';
 * import type { GridColumn } from '../core/shared/grid';
 *
 * const columns: GridColumn<Transaction>[] = [
 *   { id: 'date', field: 'date', headerName: 'Date', filterType: 'date' },
 *   { id: 'amount', field: 'amount', headerName: 'Amount', filterType: 'number', aggregation: 'sum' },
 *   { id: 'status', field: 'status', headerName: 'Status', filterType: 'enum' },
 * ];
 *
 * <MyDataGrid
 *   rows={transactions}
 *   columns={columns}
 *   rowKey="id"
 *   features={{ filtering: true, grouping: true, sorting: true }}
 * />
 * ```
 */
export const MyDataGrid = forwardRef(MyDataGridInner) as <TData>(
  props: MyDataGridProps<TData> & { ref?: Ref<GridApi<TData>> }
) => React.ReactElement;
