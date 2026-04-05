/**
 * ColumnMenu — AG Grid-style dropdown menu per column header
 *
 * Features:
 * - Sort ascending / descending
 * - Pin column (left / right / unpin)
 * - Autosize this column / all columns
 * - Group / Ungroup
 * - Choose columns (toggle visibility)
 * - Expand / Collapse all row groups
 * - Reset columns
 */

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp, ArrowDown, Pin, PinOff,
  Columns3, Group, Maximize2,
  ChevronsUpDown, ChevronsDownUp,
  RotateCcw, Eye, EyeOff,
} from 'lucide-react';
import type { Column, Table } from '@tanstack/react-table';
import { getColumnLabel } from '../adapter/columnAdapter';

interface ColumnMenuProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
  anchor: { top: number; left: number; right: number };
  onClose: () => void;
  pinnedColumns: Record<string, 'left' | 'right'>;
  onPinColumn: (colId: string, side: 'left' | 'right' | false) => void;
  groupingEnabled: boolean;
}

export function ColumnMenu<TData>({
  column,
  table,
  anchor,
  onClose,
  pinnedColumns,
  onPinColumn,
  groupingEnabled,
}: ColumnMenuProps<TData>) {
  const ref = useRef<HTMLDivElement>(null);
  const [showColumns, setShowColumns] = useState(false);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();
  const isPinned = pinnedColumns[column.id];
  const canGroup = column.getCanGroup();
  const isGrouped = table.getState().grouping.includes(column.id);
  const hasGrouping = table.getState().grouping.length > 0;

  // Position: prefer dropping below anchor, align to left or right of column
  const viewportW = window.innerWidth;
  const menuWidth = 220;
  const alignRight = anchor.left + menuWidth > viewportW;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchor.top + 2,
    ...(alignRight
      ? { right: viewportW - anchor.right }
      : { left: anchor.left }),
    width: menuWidth,
    zIndex: 9999,
  };

  if (showColumns) {
    return (
      <div ref={ref} className="mg-dropdown" style={style}>
        <div className="mg-menu-label">Synliga kolumner</div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {table.getAllLeafColumns().map(col => {
            const label = getColumnLabel(col.columnDef.meta) || col.id;
            const isVisible = col.getIsVisible();
            return (
              <button
                key={col.id}
                className="mg-menu-item"
                onClick={() => col.toggleVisibility()}
              >
                {isVisible
                  ? <Eye className="w-3.5 h-3.5 text-foreground/50" />
                  : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />
                }
                <span className={isVisible ? '' : 'text-muted-foreground/50'}>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="mg-menu-separator" />
        <button className="mg-menu-item" onClick={() => setShowColumns(false)}>
          ← Tillbaka
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="mg-dropdown" style={style}>
      {/* Sort */}
      {canSort && (
        <>
          <button
            className={`mg-menu-item ${sorted === 'asc' ? 'mg-menu-item--active' : ''}`}
            onClick={() => { column.toggleSorting(false); onClose(); }}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Sortera stigande
          </button>
          <button
            className={`mg-menu-item ${sorted === 'desc' ? 'mg-menu-item--active' : ''}`}
            onClick={() => { column.toggleSorting(true); onClose(); }}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Sortera fallande
          </button>
          <div className="mg-menu-separator" />
        </>
      )}

      {/* Pin */}
      {isPinned ? (
        <button
          className="mg-menu-item"
          onClick={() => { onPinColumn(column.id, false); onClose(); }}
        >
          <PinOff className="w-3.5 h-3.5" />
          Lossa kolumn
        </button>
      ) : (
        <>
          <button
            className="mg-menu-item"
            onClick={() => { onPinColumn(column.id, 'left'); onClose(); }}
          >
            <Pin className="w-3.5 h-3.5" />
            Fäst vänster
          </button>
          <button
            className="mg-menu-item"
            onClick={() => { onPinColumn(column.id, 'right'); onClose(); }}
          >
            <Pin className="w-3.5 h-3.5 rotate-180" />
            Fäst höger
          </button>
        </>
      )}

      <div className="mg-menu-separator" />

      {/* Autosize */}
      <button
        className="mg-menu-item"
        onClick={() => {
          column.resetSize();
          onClose();
        }}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        Autoanpassa kolumn
      </button>
      <button
        className="mg-menu-item"
        onClick={() => {
          table.resetColumnSizing();
          onClose();
        }}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        Autoanpassa alla
      </button>

      <div className="mg-menu-separator" />

      {/* Grouping */}
      {groupingEnabled && canGroup && (
        <>
          {isGrouped ? (
            <button
              className="mg-menu-item"
              onClick={() => {
                table.setGrouping(prev => prev.filter(g => g !== column.id));
                onClose();
              }}
            >
              <Group className="w-3.5 h-3.5" />
              Avgruppera
            </button>
          ) : (
            <button
              className="mg-menu-item"
              onClick={() => {
                table.setGrouping(prev => [...prev, column.id]);
                onClose();
              }}
            >
              <Group className="w-3.5 h-3.5" />
              Gruppera per kolumn
            </button>
          )}
        </>
      )}

      {groupingEnabled && hasGrouping && (
        <>
          <button
            className="mg-menu-item"
            onClick={() => { table.toggleAllRowsExpanded(true); onClose(); }}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            Expandera alla grupper
          </button>
          <button
            className="mg-menu-item"
            onClick={() => { table.toggleAllRowsExpanded(false); onClose(); }}
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
            Komprimera alla grupper
          </button>
          <div className="mg-menu-separator" />
        </>
      )}

      {/* Columns */}
      <button
        className="mg-menu-item"
        onClick={() => setShowColumns(true)}
      >
        <Columns3 className="w-3.5 h-3.5" />
        Välj kolumner
      </button>

      {/* Reset */}
      <button
        className="mg-menu-item"
        onClick={() => {
          table.resetColumnOrder();
          table.resetColumnSizing();
          table.resetColumnVisibility();
          onClose();
        }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Återställ kolumner
      </button>
    </div>
  );
}
