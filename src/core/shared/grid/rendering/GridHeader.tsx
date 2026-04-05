/**
 * GridHeader — Column headers with sort indicators, menu icon, filter icon, resize handles, drag
 *
 * Handles column pinning: reorders headers so pinned-left come first, pinned-right last.
 * Applies position:sticky with computed offsets so pinned headers stay visible during scroll.
 */

import { useState, useRef, useMemo } from 'react';
import { ArrowUp, ArrowDown, ListFilter, MoreVertical } from 'lucide-react';
import { flexRender, type HeaderGroup, type Header, type Table } from '@tanstack/react-table';
import { getColumnLabel, getGridColumn } from '../adapter/columnAdapter';
import { ColumnMenu } from './ColumnMenu';
import { ExcelFilter } from './ExcelFilter';
import { COLUMN_DRAG_TYPE } from './GroupDropZone';
import { computePinOffsets, reorderHeaders, getPinStyle, type PinOffsets } from '../utils/pinUtils';

interface GridHeaderProps<TData> {
  headerGroups: HeaderGroup<TData>[];
  headerHeight: number;
  enableResize: boolean;
  enableReorder: boolean;
  showSelectionCheckbox: boolean;
  onSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  table: Table<TData>;
  onPinColumn: (colId: string, side: 'left' | 'right' | false) => void;
  groupingEnabled: boolean;
  dragToGroupEnabled: boolean;
  hasRowActions?: boolean;
  rowActionsWidth?: number;
}

export function GridHeader<TData>({
  headerGroups,
  headerHeight,
  enableResize,
  showSelectionCheckbox,
  onSelectAll,
  allSelected,
  someSelected,
  table,
  onPinColumn,
  groupingEnabled,
  dragToGroupEnabled,
  hasRowActions = false,
  rowActionsWidth = 60,
}: GridHeaderProps<TData>) {
  const pinning = table.getState().columnPinning;
  const checkboxWidth = showSelectionCheckbox ? 40 : 0;

  return (
    <thead className="mg-thead">
      {headerGroups.map(headerGroup => {
        // Reorder headers: left-pinned → center → right-pinned
        const ordered = reorderHeaders(headerGroup.headers, pinning);
        const offsets = computePinOffsets(ordered, pinning, checkboxWidth);

        return (
          <tr key={headerGroup.id} style={{ height: headerHeight }}>
            {/* Selection checkbox header — always sticky at left:0 */}
            {showSelectionCheckbox && (
              <th
                className="mg-th mg-th--pinned-left"
                style={{
                  width: 40,
                  minWidth: 40,
                  padding: '0 8px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = !!someSelected && !allSelected; }}
                  onChange={onSelectAll}
                  className="w-3.5 h-3.5 rounded border-border accent-foreground"
                />
              </th>
            )}

            {ordered.map(header => (
              <HeaderCell
                key={header.id}
                header={header}
                headerHeight={headerHeight}
                enableResize={enableResize}
                table={table}
                onPinColumn={onPinColumn}
                groupingEnabled={groupingEnabled}
                dragToGroupEnabled={dragToGroupEnabled}
                pinOffsets={offsets}
              />
            ))}

            {/* Actions column header */}
            {hasRowActions && (
              <th
                className="mg-th mg-th--actions"
                style={{
                  width: rowActionsWidth,
                  minWidth: rowActionsWidth,
                  position: 'sticky',
                  right: 0,
                  zIndex: 3,
                  padding: 0,
                }}
              />
            )}
          </tr>
        );
      })}
    </thead>
  );
}

function HeaderCell<TData>({
  header,
  headerHeight,
  enableResize,
  table,
  onPinColumn,
  groupingEnabled,
  dragToGroupEnabled,
  pinOffsets,
}: {
  header: Header<TData, unknown>;
  headerHeight: number;
  enableResize: boolean;
  table: Table<TData>;
  onPinColumn: (colId: string, side: 'left' | 'right' | false) => void;
  groupingEnabled: boolean;
  dragToGroupEnabled: boolean;
  pinOffsets: PinOffsets;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const thRef = useRef<HTMLTableCellElement>(null);

  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const canFilter = header.column.getCanFilter();
  const hasActiveFilter = !!header.column.getFilterValue();
  const gridCol = getGridColumn<TData>(header.column.columnDef.meta);
  const canGroup = header.column.getCanGroup();

  const pinStyle = getPinStyle(header.column.id, pinOffsets);
  const isPinned = pinStyle !== null;
  const pinnedClass = isPinned
    ? (pinStyle.left !== undefined ? 'mg-th--pinned-left' : 'mg-th--pinned-right')
    : '';

  // Derive pinnedColumns record for ColumnMenu (must be before any early return)
  const pinnedColumns = useMemo(() => {
    const p = table.getState().columnPinning;
    const result: Record<string, 'left' | 'right'> = {};
    (p.left ?? []).forEach(id => { result[id] = 'left'; });
    (p.right ?? []).forEach(id => { result[id] = 'right'; });
    return result;
  }, [table.getState().columnPinning]);

  if (header.isPlaceholder) {
    return <th className="mg-th" style={{ width: header.getSize(), height: headerHeight }} />;
  }

  // Anchor position for menus
  const getAnchor = () => {
    if (!thRef.current) return { top: 0, left: 0, right: 0 };
    const rect = thRef.current.getBoundingClientRect();
    return { top: rect.bottom, left: rect.left, right: rect.right };
  };

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFilterOpen(false);
    setMenuOpen(!menuOpen);
  };

  const openFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setFilterOpen(!filterOpen);
  };

  // Drag support for group-by
  const handleDragStart = (e: React.DragEvent) => {
    if (!dragToGroupEnabled || !canGroup) return;
    e.dataTransfer.setData(COLUMN_DRAG_TYPE, header.column.id);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).classList.add('mg-th--dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('mg-th--dragging');
  };

  const thStyle: React.CSSProperties = {
    width: header.getSize(),
    height: headerHeight,
    ...(pinStyle ?? {}),
  };

  return (
    <th
      ref={thRef}
      className={`mg-th ${pinnedClass} ${gridCol?.headerClassName ?? ''}`}
      style={thStyle}
      draggable={dragToGroupEnabled && canGroup}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center gap-1 h-full">
        {/* Clickable label for sorting */}
        <div
          className={`flex items-center gap-1 min-w-0 flex-1 ${canSort ? 'cursor-pointer' : ''}`}
          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
        >
          <span className="truncate text-[11px]">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </span>

          {/* Sort indicator */}
          {sorted === 'asc' && <ArrowUp className="w-3 h-3 text-foreground shrink-0" />}
          {sorted === 'desc' && <ArrowDown className="w-3 h-3 text-foreground shrink-0" />}
        </div>

        {/* Icon buttons — filter + menu */}
        <div className="mg-th-icons">
          {/* Filter icon */}
          {canFilter && (
            <button
              className={`mg-th-icon-btn ${hasActiveFilter ? 'mg-th-icon-btn--active' : ''}`}
              onClick={openFilter}
              title="Filter"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Menu icon */}
          <button
            className="mg-th-icon-btn"
            onClick={openMenu}
            title="Meny"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Resize handle */}
      {enableResize && header.column.getCanResize() && (
        <div
          className={`mg-resize-handle ${header.column.getIsResizing() ? 'mg-resize-handle--active' : ''}`}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onClick={e => e.stopPropagation()}
        />
      )}

      {/* Column Menu dropdown */}
      {menuOpen && (
        <ColumnMenu
          column={header.column}
          table={table}
          anchor={getAnchor()}
          onClose={() => setMenuOpen(false)}
          pinnedColumns={pinnedColumns}
          onPinColumn={onPinColumn}
          groupingEnabled={groupingEnabled}
        />
      )}

      {/* Excel Filter dropdown */}
      {filterOpen && (
        <ExcelFilter
          column={header.column}
          table={table}
          anchor={getAnchor()}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </th>
  );
}
