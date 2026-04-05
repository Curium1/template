/**
 * Selection Model
 *
 * Manages row selection logic independent of rendering.
 * Supports single and multi selection modes.
 */

export type SelectionMode = 'single' | 'multi' | false;

export interface SelectionState {
  selectedKeys: Set<string>;
  lastSelectedKey: string | null;
}

export function createSelectionState(): SelectionState {
  return { selectedKeys: new Set(), lastSelectedKey: null };
}

/** Toggle a single row's selection */
export function toggleRowSelection(
  state: SelectionState,
  key: string,
  mode: SelectionMode,
  shiftKey = false,
  allKeys?: string[]
): SelectionState {
  if (mode === false) return state;

  if (mode === 'single') {
    const isSelected = state.selectedKeys.has(key);
    return {
      selectedKeys: isSelected ? new Set() : new Set([key]),
      lastSelectedKey: isSelected ? null : key,
    };
  }

  // Multi mode
  const next = new Set(state.selectedKeys);

  if (shiftKey && state.lastSelectedKey && allKeys) {
    // Range selection
    const lastIdx = allKeys.indexOf(state.lastSelectedKey);
    const currIdx = allKeys.indexOf(key);
    if (lastIdx !== -1 && currIdx !== -1) {
      const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
      for (let i = start; i <= end; i++) {
        next.add(allKeys[i]);
      }
    }
    return { selectedKeys: next, lastSelectedKey: key };
  }

  // Toggle
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return { selectedKeys: next, lastSelectedKey: key };
}

/** Select all rows */
export function selectAll(keys: string[]): SelectionState {
  return {
    selectedKeys: new Set(keys),
    lastSelectedKey: keys.length > 0 ? keys[keys.length - 1] : null,
  };
}

/** Deselect all rows */
export function deselectAll(): SelectionState {
  return createSelectionState();
}

/** Check if a key is selected */
export function isSelected(state: SelectionState, key: string): boolean {
  return state.selectedKeys.has(key);
}

/** Get selected keys as array */
export function getSelectedKeys(state: SelectionState): string[] {
  return Array.from(state.selectedKeys);
}
