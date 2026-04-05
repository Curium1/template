/**
 * Event Adapter
 *
 * Normalizes TanStack state change callbacks into our event contracts.
 * Provides debounced change emission.
 */

import type { GridViewState, GridStateChangeEvent } from '../public/gridTypes';

export type StateChangeSource = GridStateChangeEvent['source'];

/** Create a debounced state change emitter */
export function createStateEmitter(
  callback?: (event: GridStateChangeEvent) => void,
  debounceMs = 100
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: GridStateChangeEvent | null = null;

  function emit(state: GridViewState, source: StateChangeSource) {
    pending = { state, source };

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (pending && callback) {
        callback(pending);
      }
      pending = null;
      timer = null;
    }, debounceMs);
  }

  function flush() {
    if (timer) clearTimeout(timer);
    if (pending && callback) {
      callback(pending);
    }
    pending = null;
    timer = null;
  }

  function destroy() {
    if (timer) clearTimeout(timer);
    pending = null;
  }

  return { emit, flush, destroy };
}

/**
 * Extract a row key from row data using the specified key field.
 */
export function getRowKey<TData>(row: TData, rowKey: string): string {
  const value = (row as Record<string, unknown>)[rowKey];
  if (value == null) return String(Math.random());
  return String(value);
}
