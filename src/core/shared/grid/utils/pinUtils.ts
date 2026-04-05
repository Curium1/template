/**
 * pinUtils — Helpers for column pinning layout
 *
 * Computes:
 * - Reordered column arrays (left-pinned → center → right-pinned)
 * - Sticky offset maps for position:sticky left/right values
 */

import type { CSSProperties } from 'react';
import type { Header, Cell, ColumnPinningState } from '@tanstack/react-table';

export interface PinOffsets {
  left: Record<string, number>;
  right: Record<string, number>;
}

/**
 * Reorder header objects so left-pinned come first, right-pinned come last.
 * Maintains the order within each pinning group.
 */
export function reorderHeaders<TData>(
  headers: Header<TData, unknown>[],
  pinning: ColumnPinningState,
): Header<TData, unknown>[] {
  const leftIds = pinning.left ?? [];
  const rightIds = pinning.right ?? [];
  const leftSet = new Set(leftIds);
  const rightSet = new Set(rightIds);

  const leftHeaders = leftIds
    .map(id => headers.find(h => h.column.id === id))
    .filter((h): h is Header<TData, unknown> => !!h);

  const centerHeaders = headers.filter(h =>
    !leftSet.has(h.column.id) && !rightSet.has(h.column.id)
  );

  const rightHeaders = rightIds
    .map(id => headers.find(h => h.column.id === id))
    .filter((h): h is Header<TData, unknown> => !!h);

  return [...leftHeaders, ...centerHeaders, ...rightHeaders];
}

/**
 * Reorder cells so left-pinned come first, right-pinned come last.
 */
export function reorderCells<TData>(
  cells: Cell<TData, unknown>[],
  pinning: ColumnPinningState,
): Cell<TData, unknown>[] {
  const leftIds = pinning.left ?? [];
  const rightIds = pinning.right ?? [];
  const leftSet = new Set(leftIds);
  const rightSet = new Set(rightIds);

  const leftCells = leftIds
    .map(id => cells.find(c => c.column.id === id))
    .filter((c): c is Cell<TData, unknown> => !!c);

  const centerCells = cells.filter(c =>
    !leftSet.has(c.column.id) && !rightSet.has(c.column.id)
  );

  const rightCells = rightIds
    .map(id => cells.find(c => c.column.id === id))
    .filter((c): c is Cell<TData, unknown> => !!c);

  return [...leftCells, ...centerCells, ...rightCells];
}

/**
 * Compute sticky left/right offsets for pinned columns.
 */
export function computePinOffsets<TItem extends { column: { id: string; getSize: () => number } }>(
  items: TItem[],
  pinning: ColumnPinningState,
  checkboxWidth: number,
): PinOffsets {
  const leftIds = pinning.left ?? [];
  const rightIds = pinning.right ?? [];

  const left: Record<string, number> = {};
  let leftAcc = checkboxWidth;
  for (const id of leftIds) {
    const item = items.find(i => i.column.id === id);
    if (item) {
      left[id] = leftAcc;
      leftAcc += item.column.getSize();
    }
  }

  const right: Record<string, number> = {};
  let rightAcc = 0;
  for (const id of [...rightIds].reverse()) {
    const item = items.find(i => i.column.id === id);
    if (item) {
      right[id] = rightAcc;
      rightAcc += item.column.getSize();
    }
  }

  return { left, right };
}

/**
 * Get the inline style for a pinned column cell.
 * Returns null if the column is not pinned.
 */
export function getPinStyle(
  columnId: string,
  offsets: PinOffsets,
): CSSProperties | null {
  if (columnId in offsets.left) {
    return {
      position: 'sticky',
      left: offsets.left[columnId],
      zIndex: 3,
    };
  }

  if (columnId in offsets.right) {
    return {
      position: 'sticky',
      right: offsets.right[columnId],
      zIndex: 3,
    };
  }

  return null;
}
