/**
 * useGridVirtualization
 *
 * Wraps @tanstack/react-virtual behind our own interface.
 * Consuming code never imports from @tanstack/react-virtual directly.
 */

import { useRef, useCallback } from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';

export interface VirtualRow {
  index: number;
  start: number;
  size: number;
  key: string | number;
}

export interface VirtualizationResult {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Virtual rows to render */
  virtualRows: VirtualRow[];
  /** Total height of all rows (for spacer) */
  totalHeight: number;
  /** Scroll to a specific row index */
  scrollToIndex: (index: number) => void;
  /** The virtualizer instance (internal, for measurements) */
  virtualizer: Virtualizer<HTMLDivElement, Element>;
}

export function useGridVirtualization(options: {
  enabled: boolean;
  rowCount: number;
  estimateSize: number;
  overscan?: number;
}): VirtualizationResult {
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: options.rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => options.estimateSize,
    overscan: options.overscan ?? 10,
    enabled: options.enabled,
  });

  const virtualRows: VirtualRow[] = virtualizer.getVirtualItems().map(item => ({
    index: item.index,
    start: item.start,
    size: item.size,
    key: item.key,
  }));

  const scrollToIndex = useCallback(
    (index: number) => virtualizer.scrollToIndex(index, { align: 'center' }),
    [virtualizer]
  );

  return {
    containerRef,
    virtualRows,
    totalHeight: virtualizer.getTotalSize(),
    scrollToIndex,
    virtualizer,
  };
}
