/**
 * Filter Operator Registry
 *
 * Defines all built-in filter operators used by MyDataGrid.
 * Each operator specifies which column types it applies to, how many
 * inputs it expects, and a predicate function for row-level evaluation.
 *
 * Operators are registered in a Map for O(1) lookup.
 * Custom operators can be added via `registerFilterOperator()`.
 */

export type FilterInputCount = 0 | 1 | 2;
export type FilterColumnType = 'text' | 'number' | 'boolean' | 'date' | 'enum';

export interface FilterOperator {
  /** Unique operator ID, e.g. 'contains', 'gt', 'between' */
  id: string;
  /** Human-readable label (fallback) */
  label: string;
  /** i18n key for label */
  labelKey: string;
  /** Column types this operator applies to */
  types: FilterColumnType[];
  /** Number of value inputs: 0 (boolean ops), 1 (most), 2 (between) */
  inputCount: FilterInputCount;
  /** Row-level predicate. Returns true if the row matches. */
  predicate: (cellValue: unknown, filterValue: unknown, filterValue2?: unknown) => boolean;
}

// ─── Helpers ───

function toString(v: unknown): string {
  if (v == null) return '';
  return String(v).toLowerCase();
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function stripTime(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// ─── Built-in Operators ───

const BUILTIN_OPERATORS: FilterOperator[] = [
  // ── Text ──
  {
    id: 'contains',
    label: 'Contains',
    labelKey: 'grid.filter.contains',
    types: ['text'],
    inputCount: 1,
    predicate: (cell, val) => toString(cell).includes(toString(val)),
  },
  {
    id: 'notContains',
    label: 'Does not contain',
    labelKey: 'grid.filter.notContains',
    types: ['text'],
    inputCount: 1,
    predicate: (cell, val) => !toString(cell).includes(toString(val)),
  },
  {
    id: 'equals',
    label: 'Equals',
    labelKey: 'grid.filter.equals',
    types: ['text'],
    inputCount: 1,
    predicate: (cell, val) => toString(cell) === toString(val),
  },
  {
    id: 'notEquals',
    label: 'Not equals',
    labelKey: 'grid.filter.notEquals',
    types: ['text'],
    inputCount: 1,
    predicate: (cell, val) => toString(cell) !== toString(val),
  },
  {
    id: 'startsWith',
    label: 'Starts with',
    labelKey: 'grid.filter.startsWith',
    types: ['text'],
    inputCount: 1,
    predicate: (cell, val) => toString(cell).startsWith(toString(val)),
  },
  {
    id: 'endsWith',
    label: 'Ends with',
    labelKey: 'grid.filter.endsWith',
    types: ['text'],
    inputCount: 1,
    predicate: (cell, val) => toString(cell).endsWith(toString(val)),
  },

  // ── Number ──
  {
    id: 'eq',
    label: '=',
    labelKey: 'grid.filter.eq',
    types: ['number'],
    inputCount: 1,
    predicate: (cell, val) => toNumber(cell) === toNumber(val),
  },
  {
    id: 'neq',
    label: '≠',
    labelKey: 'grid.filter.neq',
    types: ['number'],
    inputCount: 1,
    predicate: (cell, val) => toNumber(cell) !== toNumber(val),
  },
  {
    id: 'gt',
    label: '>',
    labelKey: 'grid.filter.gt',
    types: ['number'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toNumber(cell), v = toNumber(val);
      return c != null && v != null && c > v;
    },
  },
  {
    id: 'gte',
    label: '≥',
    labelKey: 'grid.filter.gte',
    types: ['number'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toNumber(cell), v = toNumber(val);
      return c != null && v != null && c >= v;
    },
  },
  {
    id: 'lt',
    label: '<',
    labelKey: 'grid.filter.lt',
    types: ['number'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toNumber(cell), v = toNumber(val);
      return c != null && v != null && c < v;
    },
  },
  {
    id: 'lte',
    label: '≤',
    labelKey: 'grid.filter.lte',
    types: ['number'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toNumber(cell), v = toNumber(val);
      return c != null && v != null && c <= v;
    },
  },
  {
    id: 'between',
    label: 'Between',
    labelKey: 'grid.filter.between',
    types: ['number'],
    inputCount: 2,
    predicate: (cell, val, val2) => {
      const c = toNumber(cell), lo = toNumber(val), hi = toNumber(val2);
      return c != null && lo != null && hi != null && c >= lo && c <= hi;
    },
  },

  // ── Boolean ──
  {
    id: 'isTrue',
    label: 'Is true',
    labelKey: 'grid.filter.isTrue',
    types: ['boolean'],
    inputCount: 0,
    predicate: (cell) => cell === true || cell === 'true' || cell === 1,
  },
  {
    id: 'isFalse',
    label: 'Is false',
    labelKey: 'grid.filter.isFalse',
    types: ['boolean'],
    inputCount: 0,
    predicate: (cell) => cell === false || cell === 'false' || cell === 0,
  },

  // ── Date ──
  {
    id: 'dateEquals',
    label: 'On date',
    labelKey: 'grid.filter.dateEquals',
    types: ['date'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toDate(cell), v = toDate(val);
      return c != null && v != null && stripTime(c) === stripTime(v);
    },
  },
  {
    id: 'dateBefore',
    label: 'Before',
    labelKey: 'grid.filter.dateBefore',
    types: ['date'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toDate(cell), v = toDate(val);
      return c != null && v != null && stripTime(c) < stripTime(v);
    },
  },
  {
    id: 'dateAfter',
    label: 'After',
    labelKey: 'grid.filter.dateAfter',
    types: ['date'],
    inputCount: 1,
    predicate: (cell, val) => {
      const c = toDate(cell), v = toDate(val);
      return c != null && v != null && stripTime(c) > stripTime(v);
    },
  },
  {
    id: 'dateBetween',
    label: 'Between dates',
    labelKey: 'grid.filter.dateBetween',
    types: ['date'],
    inputCount: 2,
    predicate: (cell, val, val2) => {
      const c = toDate(cell), lo = toDate(val), hi = toDate(val2);
      return c != null && lo != null && hi != null &&
        stripTime(c) >= stripTime(lo) && stripTime(c) <= stripTime(hi);
    },
  },

  // ── Enum / Set ──
  {
    id: 'in',
    label: 'Is any of',
    labelKey: 'grid.filter.in',
    types: ['enum'],
    inputCount: 1,
    predicate: (cell, val) => {
      const set = Array.isArray(val) ? val : [val];
      return set.some(v => toString(cell) === toString(v));
    },
  },
  {
    id: 'notIn',
    label: 'Is none of',
    labelKey: 'grid.filter.notIn',
    types: ['enum'],
    inputCount: 1,
    predicate: (cell, val) => {
      const set = Array.isArray(val) ? val : [val];
      return !set.some(v => toString(cell) === toString(v));
    },
  },

  // ── Universal ──
  {
    id: 'empty',
    label: 'Is empty',
    labelKey: 'grid.filter.empty',
    types: ['text', 'number', 'date', 'enum'],
    inputCount: 0,
    predicate: (cell) => cell == null || cell === '',
  },
  {
    id: 'notEmpty',
    label: 'Is not empty',
    labelKey: 'grid.filter.notEmpty',
    types: ['text', 'number', 'date', 'enum'],
    inputCount: 0,
    predicate: (cell) => cell != null && cell !== '',
  },
];

// ─── Registry ───

const operatorRegistry = new Map<string, FilterOperator>();

// Register built-ins
BUILTIN_OPERATORS.forEach(op => operatorRegistry.set(op.id, op));

/** Get an operator by ID */
export function getFilterOperator(id: string): FilterOperator | undefined {
  return operatorRegistry.get(id);
}

/** Get all operators applicable to a column type */
export function getOperatorsForType(type: FilterColumnType): FilterOperator[] {
  return Array.from(operatorRegistry.values()).filter(op =>
    op.types.includes(type)
  );
}

/** Register a custom operator */
export function registerFilterOperator(operator: FilterOperator): void {
  operatorRegistry.set(operator.id, operator);
}

/** Get the default operator for a column type */
export function getDefaultOperator(type: FilterColumnType): string {
  switch (type) {
    case 'text': return 'contains';
    case 'number': return 'eq';
    case 'boolean': return 'isTrue';
    case 'date': return 'dateEquals';
    case 'enum': return 'in';
    default: return 'contains';
  }
}

/** All registered operator IDs */
export function getAllOperatorIds(): string[] {
  return Array.from(operatorRegistry.keys());
}
