/**
 * GroupDropZone — Drag column headers here to pivot/group
 *
 * Shows as a drop zone above the header. Columns are dragged from
 * the header and dropped here to create grouping. Existing groups
 * are shown as removable chips.
 */

import { useState, useCallback } from 'react';
import { X, Group, GripVertical } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { getColumnLabel } from '../adapter/columnAdapter';

// ─── Drag data type ───
export const COLUMN_DRAG_TYPE = 'application/x-mg-column-id';

interface GroupDropZoneProps<TData> {
  table: Table<TData>;
  grouping: string[];
}

export function GroupDropZone<TData>({
  table,
  grouping,
}: GroupDropZoneProps<TData>) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Must preventDefault to allow drop
    if (e.dataTransfer.types.includes(COLUMN_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const columnId = e.dataTransfer.getData(COLUMN_DRAG_TYPE);
    if (columnId && !grouping.includes(columnId)) {
      // Verify the column is groupable
      const col = table.getColumn(columnId);
      if (col?.getCanGroup()) {
        table.setGrouping(prev => [...prev, columnId]);
      }
    }
  }, [grouping, table]);

  const removeGroup = useCallback((colId: string) => {
    table.setGrouping(prev => prev.filter(g => g !== colId));
  }, [table]);

  const clearAll = useCallback(() => {
    table.setGrouping([]);
  }, [table]);

  // Reorder by drag within the zone
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleChipDragStart = useCallback((e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(idx);
  }, []);

  const handleChipDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleChipDrop = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const sourceStr = e.dataTransfer.getData('text/plain');
    const sourceIdx = parseInt(sourceStr, 10);
    if (!isNaN(sourceIdx) && sourceIdx !== targetIdx) {
      table.setGrouping(prev => {
        const next = [...prev];
        const [moved] = next.splice(sourceIdx, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
    }
    setDragIndex(null);
  }, [table]);

  const isEmpty = grouping.length === 0;

  return (
    <div
      className={`mg-group-zone ${isDragOver ? 'mg-group-zone--dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Group className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />

      {isEmpty ? (
        <span className="text-[11px] text-muted-foreground/40 select-none">
          Dra en kolumn hit för att gruppera
        </span>
      ) : (
        <>
          {grouping.map((colId, idx) => {
            const col = table.getColumn(colId);
            const label = col ? getColumnLabel(col.columnDef.meta) : colId;
            return (
              <div
                key={colId}
                className="mg-group-chip"
                draggable
                onDragStart={e => handleChipDragStart(e, idx)}
                onDragOver={handleChipDragOver}
                onDrop={e => handleChipDrop(e, idx)}
                style={{ opacity: dragIndex === idx ? 0.4 : 1 }}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground/40" />
                <span>{label}</span>
                <button
                  onClick={() => removeGroup(colId)}
                  className="p-0.5 rounded-full hover:bg-foreground/10 -mr-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={clearAll}
            className="ml-1 text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            Rensa
          </button>
        </>
      )}
    </div>
  );
}
