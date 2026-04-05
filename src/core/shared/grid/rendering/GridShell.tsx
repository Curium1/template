/**
 * GridShell — Root grid container
 *
 * Key layout: A SINGLE scroll container holds the <table> with
 * both <thead> (sticky) and <tbody>. This ensures the header
 * scrolls HORIZONTALLY with the data but stays VERTICALLY fixed.
 *
 * Assembles: GroupDropZone, Toolbar, ScrollContainer(Header+Body), StatusBar
 */

import { useState, useCallback, useMemo } from 'react';
import type { Table, Row } from '@tanstack/react-table';
import type { MyDataGridProps, GridFeatures, GridViewState } from '../public/gridTypes';
import { GridToolbar } from './GridToolbar';
import { GridHeader } from './GridHeader';
import { GroupDropZone } from './GroupDropZone';
import { GridRow } from './GridRow';
import { GroupRow } from './GroupRow';
import { GridOverlays } from './GridOverlays';
import { GridStatusBar } from './GridStatusBar';
import { useGridVirtualization } from '../hooks/useGridVirtualization';
import type { GridInstance } from '../hooks/useGridInstance';
import { getGridColumn } from '../adapter/columnAdapter';

import '../styles/grid.css';

interface GridShellProps<TData> {
  table: Table<TData>;
  instance: GridInstance<TData>;
  props: MyDataGridProps<TData>;
}

export function GridShell<TData>({
  table,
  instance,
  props,
}: GridShellProps<TData>) {
  const {
    loading = false,
    features = {},
    height = 500,
    rowHeight = 40,
    headerHeight = 36,
    statusBar = true,
    savedViews,
    onRowClick,
    onRowDoubleClick,
    onCellEdit,
    onSaveView,
    emptyMessage,
    noResultsMessage,
    className = '',
    toolbarExtra,
  } = props;

  // Selection state
  const selectedKeys = useMemo(() => {
    const sel = table.getState().rowSelection;
    return new Set(Object.keys(sel).filter(k => sel[k]));
  }, [table.getState().rowSelection]);

  const showSelectionCheckbox = features.selection === true || features.selection === 'multi';
  const groupingEnabled = !!features.grouping;
  const showGroupDropZone = groupingEnabled && features.groupDropZone !== false;
  const grouping = table.getState().grouping;

  // Toolbar visibility: auto-hide if all sub-features are off
  const toolbarConfig = features.toolbar;
  const showToolbar = (() => {
    if (props.toolbarPosition === 'none') return false;
    if (toolbarConfig === false) return false;
    if (toolbarConfig === undefined) return true; // default: show
    // If object, show if at least one sub-toggle is true
    return Object.values(toolbarConfig).some(Boolean);
  })();

  const handleSelectRow = useCallback((rowId: string, shiftKey: boolean) => {
    table.setRowSelection(prev => {
      if (features.selection === 'single') {
        return { [rowId]: !prev[rowId] };
      }
      const next = { ...prev };
      next[rowId] = !next[rowId];
      if (!next[rowId]) delete next[rowId];
      return next;
    });
  }, [table, features.selection]);

  const handleSelectAll = useCallback(() => {
    table.toggleAllRowsSelected();
  }, [table]);


  // Export CSV
  const handleExportCsv = useCallback(() => {
    const visibleColumns = table.getVisibleLeafColumns();
    const headers = visibleColumns.map(c => {
      const meta = c.columnDef.meta as { label?: string } | undefined;
      return meta?.label ?? c.id;
    });
    const csvRows = table.getFilteredRowModel().rows.map(row =>
      visibleColumns.map(col => {
        const val = row.getValue(col.id);
        const str = val == null ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [table]);

  // Stats
  const totalRows = props.rows.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const visibleColumns = table.getVisibleLeafColumns().length;
  const totalColumns = table.getAllLeafColumns().length;
  const groupingActive = grouping.length > 0;

  const allSelected = table.getIsAllRowsSelected();
  const someSelected = table.getIsSomeRowsSelected();

  // Rows
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length + (showSelectionCheckbox ? 1 : 0);
  const isEmpty = rows.length === 0 && !loading;
  const isNoResults = isEmpty && (
    table.getState().columnFilters.length > 0 ||
    table.getState().globalFilter
  );

  // Virtualization
  const useVirtual = !!features.virtualization && rows.length > 100;
  const virtualization = useGridVirtualization({
    enabled: useVirtual,
    rowCount: rows.length,
    estimateSize: rowHeight,
    overscan: 15,
  });

  return (
    <div className={`mg-grid ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <GridToolbar
          table={table}
          globalFilter={instance.globalFilter}
          onGlobalFilterChange={instance.setGlobalFilter}
          columns={props.columns}
          features={features}
          savedViews={savedViews}
          onRestoreView={instance.restoreViewState}
          onSaveView={onSaveView}
          getViewState={instance.getViewState}
          onExportCsv={handleExportCsv}
          onExpandAll={() => table.toggleAllRowsExpanded(true)}
          onCollapseAll={() => table.toggleAllRowsExpanded(false)}
          toolbarExtra={toolbarExtra}
          filterRow={false}
          onToggleFilterRow={() => {}}
        />
      )}

      {/* Group Drop Zone (drag column here to group) */}
      {showGroupDropZone && (
        <GroupDropZone table={table} grouping={grouping} />
      )}

      {/* SINGLE scroll container: header + body */}
      <div
        ref={useVirtual ? virtualization.containerRef : undefined}
        className={`mg-scroll-container ${useVirtual ? 'mg-scroll-container--virtual' : ''}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <table className="mg-table">
          {/* Sticky header */}
          <GridHeader
            headerGroups={table.getHeaderGroups()}
            headerHeight={headerHeight}
            enableResize={features.columnResizing !== false}
            enableReorder={!!features.columnReordering}
            showSelectionCheckbox={showSelectionCheckbox}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
            table={table}
            onPinColumn={instance.pinColumn}
            groupingEnabled={groupingEnabled}
            dragToGroupEnabled={groupingEnabled}
            hasRowActions={!!props.rowActions}
            rowActionsWidth={props.rowActionsWidth}
          />

          {/* Body */}
          <tbody>
            {loading || isEmpty ? (
              <GridOverlays
                loading={loading}
                empty={isEmpty && !isNoResults}
                noResults={isNoResults}
                emptyMessage={emptyMessage}
                noResultsMessage={noResultsMessage}
                columnCount={columnCount}
              />
            ) : useVirtual ? (
              /* Virtualized rows */
              <tr>
                <td colSpan={columnCount} style={{ padding: 0, border: 'none' }}>
                  <div
                    style={{
                      height: virtualization.totalHeight,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualization.virtualRows.map(vRow => {
                      const row = rows[vRow.index];
                      return (
                        <div
                          key={row.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: vRow.size,
                            transform: `translateY(${vRow.start}px)`,
                          }}
                        >
                          <table className="mg-table" style={{ height: vRow.size }}>
                            <tbody>
                              <RowRenderer
                                row={row}
                                rowHeight={rowHeight}
                                table={table}
                                selectedKeys={selectedKeys}
                                showSelectionCheckbox={showSelectionCheckbox}
                                editable={!!features.editing}
                                onClick={onRowClick}
                                onDoubleClick={onRowDoubleClick}
                                onCellEdit={onCellEdit}
                                onSelectRow={handleSelectRow}
                                columnCount={columnCount}
                                rowActions={props.rowActions}
                                rowActionsWidth={props.rowActionsWidth}
                              />
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ) : (
              /* Standard rows */
              rows.map(row => (
                <RowRenderer
                  key={row.id}
                  row={row}
                  rowHeight={rowHeight}
                  table={table}
                  selectedKeys={selectedKeys}
                  showSelectionCheckbox={showSelectionCheckbox}
                  editable={!!features.editing}
                  onClick={onRowClick}
                  onDoubleClick={onRowDoubleClick}
                  onCellEdit={onCellEdit}
                  onSelectRow={handleSelectRow}
                  columnCount={columnCount}
                  rowActions={props.rowActions}
                  rowActionsWidth={props.rowActionsWidth}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      {statusBar && (
        <GridStatusBar
          totalRows={totalRows}
          filteredRows={filteredRows}
          selectedCount={selectedKeys.size}
          visibleColumns={visibleColumns}
          totalColumns={totalColumns}
          groupingActive={groupingActive}
          paginationEnabled={!!features.pagination}
          pageIndex={instance.pagination.pageIndex}
          pageSize={instance.pagination.pageSize}
          pageCount={table.getPageCount()}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onFirstPage={() => table.firstPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onLastPage={() => table.lastPage()}
          onPageSizeChange={(size) => instance.setPagination({ pageIndex: 0, pageSize: size })}
          pageSizeOptions={props.pageSizeOptions ?? [25, 50, 100, 200]}
        />
      )}
    </div>
  );
}

// ─── Row type dispatcher ───

function RowRenderer<TData>({
  row,
  rowHeight,
  table,
  selectedKeys,
  showSelectionCheckbox,
  editable,
  onClick,
  onDoubleClick,
  onCellEdit,
  onSelectRow,
  columnCount,
  rowActions,
  rowActionsWidth,
}: {
  row: Row<TData>;
  rowHeight: number;
  table: Table<TData>;
  selectedKeys: Set<string>;
  showSelectionCheckbox: boolean;
  editable: boolean;
  onClick?: (row: TData, event: React.MouseEvent) => void;
  onDoubleClick?: (row: TData, event: React.MouseEvent) => void;
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown, oldValue: unknown) => void;
  onSelectRow?: (rowId: string, shiftKey: boolean) => void;
  columnCount: number;
  rowActions?: (row: TData) => React.ReactNode;
  rowActionsWidth?: number;
}) {
  if (row.getIsGrouped()) {
    return (
      <GroupRow
        row={row}
        columnCount={columnCount}
        rowHeight={rowHeight}
        depth={row.depth}
      />
    );
  }

  return (
    <GridRow<TData>
      row={row}
      isSelected={selectedKeys.has(row.id)}
      rowHeight={rowHeight}
      editable={editable}
      table={table}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onCellEdit={onCellEdit}
      onSelect={onSelectRow}
      showSelectionCheckbox={showSelectionCheckbox}
      rowActions={rowActions}
      rowActionsWidth={rowActionsWidth}
    />
  );
}
