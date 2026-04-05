/**
 * GridCell — Individual cell renderer
 *
 * Handles display mode and inline edit mode.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { flexRender, type Cell } from '@tanstack/react-table';
import { getGridColumn } from '../adapter/columnAdapter';

interface GridCellProps<TData> {
  cell: Cell<TData, unknown>;
  isSelected: boolean;
  editable: boolean;
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown, oldValue: unknown) => void;
  rowKey: string;
  style?: React.CSSProperties;
  pinnedClass?: string;
}

export function GridCell<TData>({
  cell,
  editable,
  onCellEdit,
  rowKey,
  style,
  pinnedClass = '',
}: GridCellProps<TData>) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const gridCol = getGridColumn<TData>(cell.column.columnDef.meta);
  const canEdit = editable && gridCol?.editable;

  const startEdit = useCallback(() => {
    if (!canEdit) return;
    const val = cell.getValue();
    setEditValue(val == null ? '' : String(val));
    setEditing(true);
  }, [canEdit, cell]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const oldValue = cell.getValue();
    if (String(oldValue ?? '') !== editValue && onCellEdit) {
      onCellEdit(rowKey, cell.column.id, editValue, oldValue);
    }
  }, [cell, editValue, onCellEdit, rowKey]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const isGrouped = cell.getIsGrouped();
  const isAggregated = cell.getIsAggregated();
  const isPlaceholder = cell.getIsPlaceholder();

  const className = `mg-td ${pinnedClass} ${gridCol?.className ?? ''}`.trim();

  if (isPlaceholder) {
    return <td className={className} style={style} />;
  }

  if (isAggregated) {
    return (
      <td className={className} style={style}>
        <span className="text-[12px] font-semibold text-foreground/70 tabular-nums">
          {flexRender(
            cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
            cell.getContext()
          )}
        </span>
      </td>
    );
  }

  // Skip grouped cell rendering — GroupRow handles it
  if (isGrouped) return null;

  return (
    <td
      className={className}
      style={style}
      onDoubleClick={canEdit ? startEdit : undefined}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="w-full px-1 py-0.5 -mx-1 rounded border border-ring/40 bg-background text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30"
        />
      ) : (
        flexRender(cell.column.columnDef.cell, cell.getContext())
      )}
    </td>
  );
}
