/**
 * GridBody — Scrollable table body with virtual or standard rendering
 */

import type { Table, Row } from '@tanstack/react-table';
import { GridRow } from './GridRow';
import { GroupRow } from './GroupRow';
import { GridOverlays } from './GridOverlays';
import { useGridVirtualization } from '../hooks/useGridVirtualization';
import type { GridFeatures } from '../public/gridTypes';

interface GridBodyProps<TData> {
  table: Table<TData>;
  loading: boolean;
  rowHeight: number;
  height: number | string;
  features: GridFeatures;
  pinnedColumns: Record<string, 'left' | 'right'>;
  selectedKeys: Set<string>;
  onClick?: (row: TData, event: React.MouseEvent) => void;
  onDoubleClick?: (row: TData, event: React.MouseEvent) => void;
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown, oldValue: unknown) => void;
  onSelectRow?: (rowId: string, shiftKey: boolean) => void;
  showSelectionCheckbox: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
}

export function GridBody<TData>({
  table,
  loading,
  rowHeight,
  height,
  features,
  pinnedColumns,
  selectedKeys,
  onClick,
  onDoubleClick,
  onCellEdit,
  onSelectRow,
  showSelectionCheckbox,
  emptyMessage,
  noResultsMessage,
}: GridBodyProps<TData>) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length + (showSelectionCheckbox ? 1 : 0);
  const isEmpty = rows.length === 0 && !loading;
  const isNoResults = isEmpty && (
    table.getState().columnFilters.length > 0 ||
    table.getState().globalFilter
  );

  const useVirtual = !!features.virtualization && rows.length > 100;
  const heightPx = typeof height === 'number' ? height : 500;

  const virtualization = useGridVirtualization({
    enabled: useVirtual,
    rowCount: rows.length,
    estimateSize: rowHeight,
    overscan: 15,
  });

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    overflow: 'auto',
  };

  if (useVirtual) {
    return (
      <div
        ref={virtualization.containerRef}
        className="mg-body mg-body--virtual"
        style={containerStyle}
      >
        <table className="mg-table">
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
            ) : (
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
                                pinnedColumns={pinnedColumns}
                                selectedKeys={selectedKeys}
                                showSelectionCheckbox={showSelectionCheckbox}
                                editable={!!features.editing}
                                onClick={onClick}
                                onDoubleClick={onDoubleClick}
                                onCellEdit={onCellEdit}
                                onSelectRow={onSelectRow}
                                columnCount={columnCount}
                              />
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Standard (non-virtual) rendering
  return (
    <div className="mg-body" style={containerStyle}>
      <table className="mg-table">
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
          ) : (
            rows.map(row => (
              <RowRenderer
                key={row.id}
                row={row}
                rowHeight={rowHeight}
                pinnedColumns={pinnedColumns}
                selectedKeys={selectedKeys}
                showSelectionCheckbox={showSelectionCheckbox}
                editable={!!features.editing}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onCellEdit={onCellEdit}
                onSelectRow={onSelectRow}
                columnCount={columnCount}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Row type dispatcher ───

function RowRenderer<TData>({
  row,
  rowHeight,
  pinnedColumns,
  selectedKeys,
  showSelectionCheckbox,
  editable,
  onClick,
  onDoubleClick,
  onCellEdit,
  onSelectRow,
  columnCount,
}: {
  row: Row<TData>;
  rowHeight: number;
  pinnedColumns: Record<string, 'left' | 'right'>;
  selectedKeys: Set<string>;
  showSelectionCheckbox: boolean;
  editable: boolean;
  onClick?: (row: TData, event: React.MouseEvent) => void;
  onDoubleClick?: (row: TData, event: React.MouseEvent) => void;
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown, oldValue: unknown) => void;
  onSelectRow?: (rowId: string, shiftKey: boolean) => void;
  columnCount: number;
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
      pinnedColumns={pinnedColumns}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onCellEdit={onCellEdit}
      onSelect={onSelectRow}
      showSelectionCheckbox={showSelectionCheckbox}
    />
  );
}
