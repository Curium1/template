/**
 * GridStatusBar — Footer with row counts, stats, and pagination controls
 */

import {
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';

interface GridStatusBarProps {
  totalRows: number;
  filteredRows: number;
  selectedCount: number;
  visibleColumns: number;
  totalColumns: number;
  groupingActive: boolean;
  // Pagination
  paginationEnabled?: boolean;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  onFirstPage?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onLastPage?: () => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function GridStatusBar({
  totalRows,
  filteredRows,
  selectedCount,
  visibleColumns,
  totalColumns,
  groupingActive,
  paginationEnabled = false,
  pageIndex = 0,
  pageSize = 50,
  pageCount = 1,
  canPreviousPage = false,
  canNextPage = false,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}: GridStatusBarProps) {
  const isFiltered = filteredRows !== totalRows;

  // Compute displayed row range
  const rangeStart = paginationEnabled ? pageIndex * pageSize + 1 : 1;
  const rangeEnd = paginationEnabled
    ? Math.min((pageIndex + 1) * pageSize, filteredRows)
    : filteredRows;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 text-[11px] text-muted-foreground/60 tabular-nums">
      {/* Left: row stats */}
      <div className="flex items-center gap-3">
        {paginationEnabled ? (
          <span>
            {rangeStart}–{rangeEnd} av{' '}
            {isFiltered ? (
              <>{filteredRows} (totalt {totalRows})</>
            ) : (
              totalRows
            )}{' '}
            rader
          </span>
        ) : (
          <span>
            {isFiltered ? (
              <>{filteredRows} av {totalRows} rader</>
            ) : (
              <>{totalRows} rader</>
            )}
          </span>
        )}

        {selectedCount > 0 && (
          <span className="text-foreground/60 font-medium">
            • {selectedCount} valda
          </span>
        )}
        {groupingActive && (
          <span>• Grupperad</span>
        )}
      </div>

      {/* Center: pagination controls */}
      {paginationEnabled && (
        <div className="flex items-center gap-1">
          {/* Page size selector */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="mg-page-size-select"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / sida
              </option>
            ))}
          </select>

          <div className="w-px h-4 bg-border/30 mx-2" />

          {/* Navigation buttons */}
          <button
            className="mg-page-btn"
            onClick={onFirstPage}
            disabled={!canPreviousPage}
            title="Första sidan"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            className="mg-page-btn"
            onClick={onPreviousPage}
            disabled={!canPreviousPage}
            title="Föregående sida"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-[11px] text-muted-foreground/80 select-none">
            Sida{' '}
            <span className="font-semibold text-foreground/70">
              {pageIndex + 1}
            </span>
            {' '}av {pageCount}
          </span>

          <button
            className="mg-page-btn"
            onClick={onNextPage}
            disabled={!canNextPage}
            title="Nästa sida"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            className="mg-page-btn"
            onClick={onLastPage}
            disabled={!canNextPage}
            title="Sista sidan"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Right: column stats */}
      <span>
        {visibleColumns}/{totalColumns} kolumner
      </span>
    </div>
  );
}
