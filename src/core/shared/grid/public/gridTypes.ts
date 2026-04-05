/**
 * MyDataGrid — Public Types
 *
 * These are the ONLY types that consuming modules interact with.
 * No TanStack types are referenced or re-exported here.
 */

import type { ReactNode } from 'react';

// ─── Column Definition ───

export interface CellRendererProps<TData> {
  value: unknown;
  row: TData;
  rowIndex: number;
  columnId: string;
  isGrouped: boolean;
  isEditing: boolean;
}

export interface FilterRendererProps {
  value: unknown;
  onChange: (value: unknown) => void;
  operator: string;
  columnId: string;
}

export interface GridColumn<TData = unknown> {
  /** Unique column identifier */
  id: string;
  /** Data field to map. If absent, use valueGetter. */
  field?: string;
  /** Column header display name */
  headerName: string;
  /** Width in px */
  width?: number;
  /** Minimum width in px */
  minWidth?: number;
  /** Maximum width in px */
  maxWidth?: number;
  /** Allow sorting. Default: true */
  sortable?: boolean;
  /** Allow filtering. Default: true */
  filterable?: boolean;
  /** Filter type determines which operators are available */
  filterType?: 'text' | 'number' | 'boolean' | 'date' | 'enum';
  /** Override default operator list for this column */
  filterOperators?: string[];
  /** Enum values for 'enum' filterType — used for faceted filter UI */
  filterEnumValues?: string[];
  /** Allow inline editing. Default: false */
  editable?: boolean;
  /** Pin column. Default: false */
  pinned?: 'left' | 'right' | false;
  /** Initially hidden. Default: false */
  hidden?: boolean;
  /** Allow grouping. Default: true for non-numeric columns */
  groupable?: boolean;
  /** Aggregation function for grouped rows */
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  /** Extract cell value from row data */
  valueGetter?: (row: TData) => unknown;
  /** Format cell value for display */
  valueFormatter?: (value: unknown, row: TData) => string;
  /** Custom cell renderer */
  cellRenderer?: (props: CellRendererProps<TData>) => ReactNode;
  /** Custom header renderer */
  headerRenderer?: () => ReactNode;
  /** Custom filter input renderer */
  filterRenderer?: (props: FilterRendererProps) => ReactNode;
  /** CSS class for data cells */
  className?: string;
  /** CSS class for header cell */
  headerClassName?: string;
  /** Flex grow factor (like AG Grid's flex). Default: 1 */
  flex?: number;
  /** Arbitrary metadata */
  meta?: Record<string, unknown>;
}

// ─── Filter Model ───

export interface GridFilterItem {
  /** Target column ID */
  columnId: string;
  /** Operator ID from the filter operator registry */
  operator: string;
  /** Primary filter value */
  value: unknown;
  /** Secondary value (for 'between' operators) */
  value2?: unknown;
}

export type GridFilterModel = GridFilterItem[];

// ─── Sort Model ───

export interface GridSortItem {
  columnId: string;
  direction: 'asc' | 'desc';
}

export type GridSortModel = GridSortItem[];

// ─── Grouping Model ───

export type GridGroupingModel = string[];

// ─── Selection ───

export interface GridSelectionModel {
  mode: 'single' | 'multi';
  selectedRowKeys: string[];
}

// ─── View State ───

export interface GridViewState {
  columnOrder: string[];
  columnWidths: Record<string, number>;
  columnVisibility: Record<string, boolean>;
  sorting: GridSortModel;
  filters: GridFilterModel;
  grouping: GridGroupingModel;
  expandedGroups: string[];
  pinnedColumns: Record<string, 'left' | 'right'>;
}

// ─── Features Toggle ───

export interface GridFeatures {
  filtering?: boolean;
  sorting?: boolean;
  grouping?: boolean;
  /** Show the group-by drop zone. Default: inherits from `grouping`. Set false to hide. */
  groupDropZone?: boolean;
  selection?: boolean | 'single' | 'multi';
  virtualization?: boolean;
  columnReordering?: boolean;
  columnResizing?: boolean;
  editing?: boolean;
  /** Enable client-side pagination. Default: false (show all rows) */
  pagination?: boolean;
  /** Show/hide individual toolbar sections. Default: all visible when toolbar shown */
  toolbar?: {
    search?: boolean;
    filter?: boolean;
    columns?: boolean;
    views?: boolean;
    export?: boolean;
    save?: boolean;
  } | false;
}

// ─── Saved View ───

export interface GridSavedView {
  id: string;
  name: string;
  state: Partial<GridViewState>;
}

// ─── Events ───

export interface GridStateChangeEvent {
  state: GridViewState;
  source: 'sort' | 'filter' | 'group' | 'column' | 'selection' | 'expand' | 'resize' | 'restore';
}

// ─── Component Props ───

export interface MyDataGridProps<TData> {
  /** Row data */
  rows: TData[];
  /** Column definitions using our own schema */
  columns: GridColumn<TData>[];
  /** Field used as unique row identifier */
  rowKey: string;
  /** Loading state */
  loading?: boolean;
  /** Feature toggles */
  features?: GridFeatures;
  /** Initial state (applied once on mount) */
  initialState?: Partial<GridViewState>;
  /** Controlled global filter value */
  globalFilter?: string;
  /** Saved views for the view picker */
  savedViews?: GridSavedView[];
  /** Called when any grid state changes */
  onStateChange?: (event: GridStateChangeEvent) => void;
  /** Called on row click */
  onRowClick?: (row: TData, event: React.MouseEvent) => void;
  /** Called on row double-click */
  onRowDoubleClick?: (row: TData, event: React.MouseEvent) => void;
  /** Called when a cell value is edited */
  onCellEdit?: (rowKey: string, columnId: string, newValue: unknown, oldValue: unknown) => void;
  /** Called when row selection changes */
  onSelectionChange?: (selectedKeys: string[]) => void;
  /** Called when the save view button is clicked */
  onSaveView?: (state: GridViewState) => void;
  /** CSS class for the root element */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** No filter results message */
  noResultsMessage?: string;
  /** Grid height — number (px) or CSS string. Default: 500 */
  height?: number | string;
  /** Row height in px. Default: 40 */
  rowHeight?: number;
  /** Header height in px. Default: 36 */
  headerHeight?: number;
  /** Toolbar position. Default: 'top' */
  toolbarPosition?: 'top' | 'none';
  /** Custom toolbar content */
  toolbarExtra?: ReactNode;
  /** Whether to show the status bar. Default: true */
  statusBar?: boolean;
  /** Whether to show the filter row. Default: false (toolbar filter instead) */
  filterRow?: boolean;
  /** Number of rows per page when pagination is enabled. Default: 50 */
  pageSize?: number;
  /** Available page size options. Default: [25, 50, 100, 200] */
  pageSizeOptions?: number[];
  /**
   * Render actions for each row (like Vue's scoped slot).
   * Receives the row data and returns JSX (e.g. icon buttons).
   */
  rowActions?: (row: TData) => ReactNode;
  /** Width of the actions column in px. Default: 60 */
  rowActionsWidth?: number;
}
