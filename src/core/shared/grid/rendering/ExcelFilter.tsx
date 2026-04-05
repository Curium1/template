/**
 * ExcelFilter — Excel-style filter dropdown
 *
 * Two modes:
 * 1. Value List (default): search + checkbox list of unique values
 * 2. Advanced: operator dropdown + value input(s)
 *
 * Matches the reference screenshots:
 * - Search box at top
 * - (Select All) checkbox
 * - Individual value checkboxes with counts
 * - Advanced filter tab with operator selection
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Search, X, Filter, SlidersHorizontal, Check } from 'lucide-react';
import type { Column, Table } from '@tanstack/react-table';
import { getGridColumn } from '../adapter/columnAdapter';
import type { FilterColumnType } from '../core/filterOperators';

type FilterMode = 'values' | 'advanced';

interface ExcelFilterProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
  anchor: { top: number; left: number; right: number };
  onClose: () => void;
}

export function ExcelFilter<TData>({
  column,
  table,
  anchor,
  onClose,
}: ExcelFilterProps<TData>) {
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<FilterMode>('values');
  const [search, setSearch] = useState('');

  const gridCol = getGridColumn<TData>(column.columnDef.meta);
  const filterType: FilterColumnType = gridCol?.filterType ?? 'text';

  // Current filter value
  const currentFilter = column.getFilterValue() as
    | { operator?: string; value?: unknown; selectedValues?: string[] }
    | undefined;

  // Get unique values from the original data (pre-filter)
  const facetedValues = column.getFacetedUniqueValues();
  const allValues = useMemo(() => {
    const vals: { value: string; count: number }[] = [];
    facetedValues.forEach((count, value) => {
      if (value != null) {
        vals.push({ value: String(value), count });
      }
    });
    vals.sort((a, b) => a.value.localeCompare(b.value, 'sv'));
    return vals;
  }, [facetedValues]);

  // Filtered by search
  const filteredValues = useMemo(() => {
    if (!search) return allValues;
    const s = search.toLowerCase();
    return allValues.filter(v => v.value.toLowerCase().includes(s));
  }, [allValues, search]);

  // Selected values state
  const [selectedValues, setSelectedValues] = useState<Set<string>>(() => {
    if (currentFilter?.selectedValues) {
      return new Set(currentFilter.selectedValues);
    }
    // If no filter active, all are "selected"
    return new Set(allValues.map(v => v.value));
  });

  // Advanced filter state
  const [advOperator, setAdvOperator] = useState(currentFilter?.operator ?? getDefaultOp(filterType));
  const [advValue, setAdvValue] = useState(currentFilter?.value != null ? String(currentFilter.value) : '');
  const [advValue2, setAdvValue2] = useState('');

  // Close on outside click / Escape
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

  // Focus search on open
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [mode]);

  // Toggle individual value
  const toggleValue = useCallback((val: string) => {
    setSelectedValues(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  }, []);

  // Select all / none
  const toggleAll = useCallback(() => {
    if (selectedValues.size === allValues.length) {
      setSelectedValues(new Set());
    } else {
      setSelectedValues(new Set(allValues.map(v => v.value)));
    }
  }, [selectedValues, allValues]);

  // Apply value-based filter
  const applyValues = useCallback(() => {
    if (selectedValues.size === allValues.length || selectedValues.size === 0) {
      // All selected or none = clear filter
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({
        operator: 'in',
        value: Array.from(selectedValues),
        selectedValues: Array.from(selectedValues),
      });
    }
    onClose();
  }, [selectedValues, allValues, column, onClose]);

  // Apply advanced filter
  const applyAdvanced = useCallback(() => {
    if (!advValue && advOperator !== 'blank' && advOperator !== 'notBlank' && advOperator !== 'isTrue' && advOperator !== 'isFalse') {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue({
        operator: advOperator,
        value: advOperator === 'between' ? advValue : advValue,
        value2: advOperator === 'between' ? advValue2 : undefined,
      });
    }
    onClose();
  }, [advOperator, advValue, advValue2, column, onClose]);

  // Clear filter
  const clearFilter = useCallback(() => {
    column.setFilterValue(undefined);
    setSelectedValues(new Set(allValues.map(v => v.value)));
    onClose();
  }, [column, allValues, onClose]);

  // Position
  const viewportW = window.innerWidth;
  const menuWidth = 260;
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

  const isAllSelected = selectedValues.size === allValues.length;
  const isNoneSelected = selectedValues.size === 0;
  const hasActiveFilter = !!currentFilter;

  return (
    <div ref={ref} className="mg-dropdown mg-filter-popup" style={style}>
      {/* Mode tabs */}
      <div className="flex border-b border-border/30">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors ${
            mode === 'values'
              ? 'text-foreground border-b-2 border-foreground'
              : 'text-muted-foreground/60 hover:text-muted-foreground'
          }`}
          onClick={() => setMode('values')}
        >
          <Filter className="w-3 h-3" />
          Värden
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors ${
            mode === 'advanced'
              ? 'text-foreground border-b-2 border-foreground'
              : 'text-muted-foreground/60 hover:text-muted-foreground'
          }`}
          onClick={() => setMode('advanced')}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Avancerat
        </button>
      </div>

      {mode === 'values' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök..."
              className="mg-filter-search"
              style={{ paddingLeft: 32 }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Value list */}
          <div className="mg-filter-list">
            {/* Select All */}
            <button className="mg-filter-list-item mg-filter-list-item--all" onClick={toggleAll}>
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={el => {
                  if (el) el.indeterminate = !isAllSelected && !isNoneSelected;
                }}
                readOnly
                className="w-3.5 h-3.5 rounded border-border accent-foreground pointer-events-none"
              />
              <span>(Alla)</span>
              <span className="ml-auto text-[10px] text-muted-foreground/50 tabular-nums">
                {allValues.length}
              </span>
            </button>

            {filteredValues.map(({ value, count }) => (
              <button
                key={value}
                className="mg-filter-list-item"
                onClick={() => toggleValue(value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.has(value)}
                  readOnly
                  className="w-3.5 h-3.5 rounded border-border accent-foreground pointer-events-none"
                />
                <span className="truncate">{value}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                  {count}
                </span>
              </button>
            ))}

            {filteredValues.length === 0 && (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground/50">
                Inga träffar
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mg-filter-actions">
            {hasActiveFilter && (
              <button
                onClick={clearFilter}
                className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors rounded-md"
              >
                Rensa
              </button>
            )}
            <button
              onClick={applyValues}
              className="px-4 py-1.5 text-[11px] font-semibold bg-foreground text-card rounded-md hover:opacity-90 transition-opacity"
            >
              Tillämpa
            </button>
          </div>
        </>
      ) : (
        /* Advanced mode */
        <div className="p-3 space-y-3">
          {/* Operator select */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1">
              Villkor
            </label>
            <select
              value={advOperator}
              onChange={e => setAdvOperator(e.target.value)}
              className="w-full px-3 py-2 text-[12px] rounded-lg bg-secondary/50 border border-border/40 text-foreground focus:outline-none focus:border-ring/30"
            >
              {getOperatorsForType(filterType).map(op => (
                <option key={op.id} value={op.id}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* Value input(s) */}
          {!['blank', 'notBlank', 'isTrue', 'isFalse'].includes(advOperator) && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1">
                Värde
              </label>
              <input
                type={filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text'}
                value={advValue}
                onChange={e => setAdvValue(e.target.value)}
                placeholder={filterType === 'date' ? '' : 'Ange värde...'}
                className="w-full px-3 py-2 text-[12px] rounded-lg bg-secondary/50 border border-border/40 text-foreground focus:outline-none focus:border-ring/30"
              />
            </div>
          )}

          {advOperator === 'between' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1">
                Till
              </label>
              <input
                type={filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text'}
                value={advValue2}
                onChange={e => setAdvValue2(e.target.value)}
                placeholder="Ange max..."
                className="w-full px-3 py-2 text-[12px] rounded-lg bg-secondary/50 border border-border/40 text-foreground focus:outline-none focus:border-ring/30"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {hasActiveFilter && (
              <button
                onClick={clearFilter}
                className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors rounded-md"
              >
                Rensa
              </button>
            )}
            <button
              onClick={applyAdvanced}
              className="px-4 py-1.5 text-[11px] font-semibold bg-foreground text-card rounded-md hover:opacity-90 transition-opacity"
            >
              Tillämpa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Operator Helpers ───

interface OpOption {
  id: string;
  label: string;
}

function getDefaultOp(type: FilterColumnType): string {
  switch (type) {
    case 'number': return 'eq';
    case 'date': return 'dateEquals';
    case 'boolean': return 'isTrue';
    case 'enum': return 'in';
    default: return 'contains';
  }
}

function getOperatorsForType(type: FilterColumnType): OpOption[] {
  switch (type) {
    case 'number':
      return [
        { id: 'eq', label: 'Lika med' },
        { id: 'neq', label: 'Inte lika med' },
        { id: 'gt', label: 'Större än' },
        { id: 'gte', label: 'Större eller lika med' },
        { id: 'lt', label: 'Mindre än' },
        { id: 'lte', label: 'Mindre eller lika med' },
        { id: 'between', label: 'Mellan' },
        { id: 'blank', label: 'Tom' },
        { id: 'notBlank', label: 'Inte tom' },
      ];
    case 'date':
      return [
        { id: 'dateEquals', label: 'Lika med' },
        { id: 'dateBefore', label: 'Före' },
        { id: 'dateAfter', label: 'Efter' },
        { id: 'dateBetween', label: 'Mellan' },
        { id: 'blank', label: 'Tom' },
        { id: 'notBlank', label: 'Inte tom' },
      ];
    case 'boolean':
      return [
        { id: 'isTrue', label: 'Ja' },
        { id: 'isFalse', label: 'Nej' },
      ];
    case 'enum':
      return [
        { id: 'in', label: 'Lika med' },
        { id: 'notIn', label: 'Inte lika med' },
        { id: 'blank', label: 'Tom' },
        { id: 'notBlank', label: 'Inte tom' },
      ];
    default: // text
      return [
        { id: 'contains', label: 'Innehåller' },
        { id: 'notContains', label: 'Innehåller inte' },
        { id: 'equals', label: 'Lika med' },
        { id: 'notEquals', label: 'Inte lika med' },
        { id: 'startsWith', label: 'Börjar med' },
        { id: 'endsWith', label: 'Slutar med' },
        { id: 'blank', label: 'Tom' },
        { id: 'notBlank', label: 'Inte tom' },
      ];
  }
}
