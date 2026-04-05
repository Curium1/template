/**
 * Aggregation Functions
 *
 * Built-in aggregation functions for grouped rows.
 * Each function takes an array of leaf-row values and returns a single result.
 * Used by the adapter layer to provide TanStack-compatible aggregation fns.
 */

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface AggregationFn {
  id: AggregationType;
  label: string;
  labelKey: string;
  fn: (values: unknown[]) => number | string;
  /** Format the aggregated value for display */
  format?: (result: number | string) => string;
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

const BUILTIN_AGGREGATIONS: AggregationFn[] = [
  {
    id: 'count',
    label: 'Count',
    labelKey: 'grid.agg.count',
    fn: (values) => values.length,
  },
  {
    id: 'sum',
    label: 'Sum',
    labelKey: 'grid.agg.sum',
    fn: (values) => {
      let total = 0;
      for (const v of values) {
        const n = toNum(v);
        if (n != null) total += n;
      }
      return total;
    },
  },
  {
    id: 'avg',
    label: 'Average',
    labelKey: 'grid.agg.avg',
    fn: (values) => {
      let total = 0;
      let count = 0;
      for (const v of values) {
        const n = toNum(v);
        if (n != null) { total += n; count++; }
      }
      return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
    },
  },
  {
    id: 'min',
    label: 'Min',
    labelKey: 'grid.agg.min',
    fn: (values) => {
      let result: number | null = null;
      for (const v of values) {
        const n = toNum(v);
        if (n != null && (result === null || n < result)) result = n;
      }
      return result ?? 0;
    },
  },
  {
    id: 'max',
    label: 'Max',
    labelKey: 'grid.agg.max',
    fn: (values) => {
      let result: number | null = null;
      for (const v of values) {
        const n = toNum(v);
        if (n != null && (result === null || n > result)) result = n;
      }
      return result ?? 0;
    },
  },
];

// ─── Registry ───

const aggregationRegistry = new Map<AggregationType, AggregationFn>();
BUILTIN_AGGREGATIONS.forEach(a => aggregationRegistry.set(a.id, a));

/** Get an aggregation function by ID */
export function getAggregation(id: AggregationType): AggregationFn | undefined {
  return aggregationRegistry.get(id);
}

/** Execute an aggregation on a set of values */
export function aggregate(id: AggregationType, values: unknown[]): number | string {
  const agg = aggregationRegistry.get(id);
  if (!agg) return values.length;
  return agg.fn(values);
}

/** Get all registered aggregation types */
export function getAggregationTypes(): AggregationType[] {
  return Array.from(aggregationRegistry.keys());
}
