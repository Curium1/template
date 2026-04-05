/**
 * GroupRow — Expandable group header
 */

import { ChevronRight, ChevronDown } from 'lucide-react';
import { flexRender, type Row, type Cell } from '@tanstack/react-table';
import { getColumnLabel } from '../adapter/columnAdapter';

interface GroupRowProps<TData> {
  row: Row<TData>;
  columnCount: number;
  rowHeight: number;
  depth?: number;
}

export function GroupRow<TData>({ row, columnCount, rowHeight, depth = 0 }: GroupRowProps<TData>) {
  const isExpanded = row.getIsExpanded();

  // Find the grouped cell to get label
  const groupedCell = row.getVisibleCells().find((c: Cell<TData, unknown>) => c.getIsGrouped());
  const groupLabel = groupedCell
    ? flexRender(groupedCell.column.columnDef.cell, groupedCell.getContext())
    : '';

  // Get aggregated cells for inline aggregate display
  const aggregatedCells = row.getVisibleCells().filter(
    (c: Cell<TData, unknown>) => c.getIsAggregated() && c.column.columnDef.aggregatedCell
  );

  return (
    <tr
      className="mg-tr mg-tr--group cursor-pointer"
      style={{ height: rowHeight }}
      onClick={() => row.toggleExpanded()}
    >
      <td
        colSpan={columnCount}
        className="mg-td"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2">
          {/* Expand/collapse icon */}
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}

          {/* Group column label */}
          {groupedCell && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 shrink-0">
              {getColumnLabel(groupedCell.column.columnDef.meta)}:
            </span>
          )}

          {/* Group value */}
          <span className="text-[13px] font-semibold text-foreground">
            {groupLabel}
          </span>

          {/* Row count badge */}
          <span className="px-1.5 py-0.5 rounded-full bg-foreground/10 text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">
            {row.subRows.length}
          </span>

          {/* Aggregated values */}
          {aggregatedCells.length > 0 && (
            <div className="flex items-center gap-3 ml-auto">
              {aggregatedCells.map(cell => (
                <span key={cell.id} className="text-[11px] text-muted-foreground tabular-nums">
                  <span className="text-muted-foreground/50">
                    {getColumnLabel(cell.column.columnDef.meta)}:
                  </span>{' '}
                  <span className="font-semibold text-foreground/70">
                    {flexRender(
                      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
