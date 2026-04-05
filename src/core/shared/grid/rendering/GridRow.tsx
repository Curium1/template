/**
 * GridRow — Single data row
 *
 * Handles column pinning: reorders cells so pinned-left come first, pinned-right last.
 * Applies position:sticky with computed offsets for pinned cells.
 */

import type { Row, Table } from '@tanstack/react-table';
import { GridCell } from './GridCell';
import { getGridColumn } from '../adapter/columnAdapter';
import { reorderCells, computePinOffsets, getPinStyle } from '../utils/pinUtils';

interface GridRowProps<TData> {
  row: Row<TData>;
  isSelected: boolean;
  rowHeight: number;
  editable: boolean;
  table: Table<TData>;
  onClick?: (row: TData, event: React.MouseEvent) => void;
  onDoubleClick?: (row: TData, event: React.MouseEvent) => void;
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown, oldValue: unknown) => void;
  onSelect?: (rowId: string, shiftKey: boolean) => void;
  showSelectionCheckbox: boolean;
  virtualStyle?: React.CSSProperties;
  rowActions?: (row: TData) => React.ReactNode;
  rowActionsWidth?: number;
}

export function GridRow<TData>({
  row,
  isSelected,
  rowHeight,
  editable,
  table,
  onClick,
  onDoubleClick,
  onCellEdit,
  onSelect,
  showSelectionCheckbox,
  virtualStyle,
  rowActions,
  rowActionsWidth = 60,
}: GridRowProps<TData>) {
  const selectedClass = isSelected ? 'mg-tr--selected' : '';
  const pinning = table.getState().columnPinning;
  const checkboxWidth = showSelectionCheckbox ? 40 : 0;

  // Reorder cells and compute pin offsets
  const visibleCells = row.getVisibleCells();
  const orderedCells = reorderCells(visibleCells, pinning);
  const offsets = computePinOffsets(orderedCells, pinning, checkboxWidth);

  return (
    <tr
      className={`mg-tr ${selectedClass}`}
      style={{ height: rowHeight, ...virtualStyle }}
      onClick={(e) => onClick?.(row.original, e)}
      onDoubleClick={(e) => onDoubleClick?.(row.original, e)}
    >
      {/* Selection checkbox — always sticky at left:0 */}
      {showSelectionCheckbox && (
        <td
          className="mg-td mg-td--pinned-left"
          style={{
            width: 40,
            minWidth: 40,
            padding: '0 8px',
            position: 'sticky',
            left: 0,
            zIndex: 2,
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(row.id, false)}
            onClick={e => {
              e.stopPropagation();
              onSelect?.(row.id, e.shiftKey);
            }}
            className="w-3.5 h-3.5 rounded border-border accent-foreground"
          />
        </td>
      )}

      {/* Data cells — reordered by pinning */}
      {orderedCells.map(cell => {
        const colId = cell.column.id;
        const pinStyle = getPinStyle(colId, offsets);
        const isPinnedLeft = pinStyle !== null && pinStyle.left !== undefined;
        const isPinnedRight = pinStyle !== null && pinStyle.right !== undefined;
        const pinnedClass = isPinnedLeft
          ? 'mg-td--pinned-left'
          : isPinnedRight
            ? 'mg-td--pinned-right'
            : '';

        return (
          <GridCell<TData>
            key={cell.id}
            cell={cell}
            isSelected={isSelected}
            editable={editable}
            onCellEdit={onCellEdit}
            rowKey={row.id}
            pinnedClass={pinnedClass}
            style={{
              width: cell.column.getSize(),
              ...(pinStyle ?? {}),
            }}
          />
        );
      })}

      {/* Row Actions cell */}
      {rowActions && (
        <td
          className="mg-td mg-td--actions"
          style={{
            width: rowActionsWidth,
            minWidth: rowActionsWidth,
            padding: '0 8px',
            position: 'sticky',
            right: 0,
            zIndex: 2,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-0.5">
            {rowActions(row.original)}
          </div>
        </td>
      )}
    </tr>
  );
}
