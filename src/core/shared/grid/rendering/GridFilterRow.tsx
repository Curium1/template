/**
 * GridFilterRow — Per-column filter inputs
 */

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { Header, HeaderGroup } from '@tanstack/react-table';
import { getGridColumn } from '../adapter/columnAdapter';
import { getOperatorsForType, getDefaultOperator, type FilterColumnType } from '../core/filterOperators';

interface GridFilterRowProps<TData> {
  headerGroups: HeaderGroup<TData>[];
  showSelectionCheckbox: boolean;
}

export function GridFilterRow<TData>({
  headerGroups,
  showSelectionCheckbox,
}: GridFilterRowProps<TData>) {
  return (
    <thead>
      {headerGroups.map(headerGroup => (
        <tr key={`filter-${headerGroup.id}`} className="mg-filter-row">
          {showSelectionCheckbox && <th className="mg-filter-cell" style={{ width: 40 }} />}
          {headerGroup.headers.map(header => (
            <FilterCell key={header.id} header={header} />
          ))}
        </tr>
      ))}
    </thead>
  );
}

function FilterCell<TData>({ header }: { header: Header<TData, unknown> }) {
  const column = header.column;
  const gridCol = getGridColumn<TData>(column.columnDef.meta);
  const canFilter = column.getCanFilter();

  if (!canFilter || !gridCol) {
    return <th className="mg-filter-cell" style={{ width: header.getSize() }} />;
  }

  const filterType: FilterColumnType = gridCol.filterType ?? 'text';

  return (
    <th className="mg-filter-cell" style={{ width: header.getSize() }}>
      {filterType === 'enum' ? (
        <EnumFilterInput column={column} gridCol={gridCol} />
      ) : filterType === 'boolean' ? (
        <BooleanFilterInput column={column} />
      ) : filterType === 'number' ? (
        <NumberFilterInput column={column} />
      ) : filterType === 'date' ? (
        <DateFilterInput column={column} />
      ) : (
        <TextFilterInput column={column} />
      )}
    </th>
  );
}

// ─── Text Filter ───
function TextFilterInput<TData>({ column }: { column: { getFilterValue: () => unknown; setFilterValue: (v: unknown) => void } }) {
  const filterValue = column.getFilterValue() as { operator?: string; value?: string } | undefined;
  const value = filterValue?.value ?? '';

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => column.setFilterValue({
          operator: filterValue?.operator ?? 'contains',
          value: e.target.value,
        })}
        placeholder="Filter..."
        className="w-full px-2 py-1 text-[12px] rounded bg-background border border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring/30"
      />
      {value && (
        <button
          onClick={() => column.setFilterValue(undefined)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ─── Number Filter ───
function NumberFilterInput<TData>({ column }: { column: { getFilterValue: () => unknown; setFilterValue: (v: unknown) => void } }) {
  const filterValue = column.getFilterValue() as { operator?: string; value?: string } | undefined;
  const value = filterValue?.value ?? '';

  return (
    <input
      type="number"
      value={value}
      onChange={e => column.setFilterValue({
        operator: filterValue?.operator ?? 'eq',
        value: e.target.value,
      })}
      placeholder="0"
      className="w-full px-2 py-1 text-[12px] rounded bg-background border border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring/30 tabular-nums"
    />
  );
}

// ─── Date Filter ───
function DateFilterInput<TData>({ column }: { column: { getFilterValue: () => unknown; setFilterValue: (v: unknown) => void } }) {
  const filterValue = column.getFilterValue() as { operator?: string; value?: string } | undefined;
  const value = filterValue?.value ?? '';

  return (
    <input
      type="date"
      value={value}
      onChange={e => column.setFilterValue({
        operator: filterValue?.operator ?? 'dateEquals',
        value: e.target.value,
      })}
      className="w-full px-2 py-1 text-[12px] rounded bg-background border border-border/50 text-foreground focus:outline-none focus:border-ring/30"
    />
  );
}

// ─── Boolean Filter ───
function BooleanFilterInput<TData>({ column }: { column: { getFilterValue: () => unknown; setFilterValue: (v: unknown) => void } }) {
  const filterValue = column.getFilterValue() as { operator?: string } | undefined;
  const currentOp = filterValue?.operator;

  return (
    <select
      value={currentOp ?? ''}
      onChange={e => {
        const val = e.target.value;
        if (!val) { column.setFilterValue(undefined); return; }
        column.setFilterValue({ operator: val, value: true });
      }}
      className="w-full px-2 py-1 text-[12px] rounded bg-background border border-border/50 text-foreground focus:outline-none focus:border-ring/30"
    >
      <option value="">Alla</option>
      <option value="isTrue">Ja</option>
      <option value="isFalse">Nej</option>
    </select>
  );
}

// ─── Enum Filter ───
function EnumFilterInput<TData>({
  column,
  gridCol,
}: {
  column: { getFilterValue: () => unknown; setFilterValue: (v: unknown) => void; getFacetedUniqueValues: () => Map<unknown, number> };
  gridCol: { filterEnumValues?: string[] };
}) {
  const filterValue = column.getFilterValue() as { operator?: string; value?: string[] } | undefined;
  const selected = filterValue?.value ?? [];

  // Get unique values from data (faceted) or from config
  const facetedValues = column.getFacetedUniqueValues();
  const options = gridCol.filterEnumValues ?? Array.from(facetedValues.keys()).map(String).sort();

  return (
    <select
      value={selected.length === 1 ? selected[0] : ''}
      onChange={e => {
        const val = e.target.value;
        if (!val) { column.setFilterValue(undefined); return; }
        column.setFilterValue({ operator: 'in', value: [val] });
      }}
      className="w-full px-2 py-1 text-[12px] rounded bg-background border border-border/50 text-foreground focus:outline-none focus:border-ring/30"
    >
      <option value="">Alla</option>
      {options.map(opt => (
        <option key={opt} value={opt}>
          {opt}
          {facetedValues.has(opt) ? ` (${facetedValues.get(opt)})` : ''}
        </option>
      ))}
    </select>
  );
}
