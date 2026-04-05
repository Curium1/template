---
name: datagrid-usage
description: Guide for using the MyDataGrid component correctly. Consult this skill when building any table or data display. It covers the full API surface, feature tiers (from simple display to full analytics grid), and provides ready-to-use code patterns for each use case.
---

# MyDataGrid — Usage Skill

**Always consult this skill before creating or modifying any data table in this project.**

The `MyDataGrid` component is the **only** sanctioned way to display tabular data. It wraps TanStack Table internally but exposes a clean, decoupled API. Never import from `@tanstack/react-table` directly — only import from:

```tsx
import { MyDataGrid } from '@/core/shared/grid';
import type { GridColumn, GridFeatures, MyDataGridProps } from '@/core/shared/grid';
```

---

## 1. Decision Matrix — Choose the Right Tier

Match the **use case** to the correct **feature tier**. More tools ≠ better — unnecessary features add visual noise and cognitive load.

| Tier | Row Count | Use Case | Features to Enable |
|------|-----------|----------|-------------------|
| **Display** | 1–30 | Read-only reference, simple lists | `sorting` only. Hide toolbar, status bar, grouping |
| **Browse** | 30–200 | Browse & search, e.g. member lists | `sorting`, `filtering`, search in toolbar |
| **Analyze** | 200–5 000 | Analytics, finance tables | Full: `sorting`, `filtering`, `grouping`, `selection`, `pagination`, column tools |
| **Big Data** | 5 000+ | Large datasets, logs, audit trails | Everything in Analyze + `virtualization`, pagination mandatory |

### Quick Decision Rules

1. **≤ 30 rows, no actions** → Tier: Display. Minimal config.
2. **User needs to find specific rows** → Enable `filtering` + search.
3. **User needs to analyze / aggregate** → Enable `grouping` + `sorting`.
4. **User needs to act on rows** → Enable `selection` and/or `rowActions`.
5. **User needs to compare / pivot** → Enable `grouping` + `columnReordering`.
6. **> 200 rows** → Enable `pagination` (default 50/page).
7. **> 5000 rows** → Enable `virtualization` (**and** pagination).

---

## 2. Feature Tiers — Complete Examples

### Tier 1: Display (Simple Read-Only)

For settings pages, small reference tables, simple lists where the data fits on screen.

```tsx
<MyDataGrid<User>
  rows={users}
  columns={columns}
  rowKey="id"
  height={300}
  features={{
    sorting: true,
    toolbar: false,        // ← hides entire toolbar
  }}
  statusBar={false}        // ← hides footer/pagination
/>
```

**What you get**: Clean table with sortable column headers. No search bar, no filter buttons, no pagination, no group zone, no footer. Just data.

### Tier 2: Browse (Search & Filter)

For member lists, product catalogs, contact directories — tables where users look up specific records.

```tsx
<MyDataGrid<Member>
  rows={members}
  columns={columns}
  rowKey="id"
  height={450}
  features={{
    sorting: true,
    filtering: true,
    columnResizing: true,
    toolbar: {
      search: true,
      filter: true,
      columns: false,      // ← hide column visibility toggle
      views: false,        // ← hide saved views
      export: false,       // ← hide export button
      save: false,         // ← hide save view button
    },
  }}
  onRowClick={(row) => navigate(`/members/${row.id}`)}
/>
```

**What you get**: Search bar + column filter menus. Clean toolbar with only relevant tools. Row click navigation.

### Tier 3: Analyze (Full Analytics Grid)

For finance tables, transaction logs, project lists — tables where users need to group, compare, and export data.

```tsx
<MyDataGrid<Transaction>
  rows={transactions}
  columns={columns}
  rowKey="id"
  height={520}
  features={{
    sorting: true,
    filtering: true,
    grouping: true,
    selection: 'multi',
    columnResizing: true,
    columnReordering: true,
    pagination: true,
  }}
  pageSize={50}
  savedViews={views}
  onSaveView={handleSaveView}
  onSelectionChange={handleSelectionChange}
  rowActions={(row) => (
    <>
      <button onClick={() => handleEdit(row)} className="p-1 hover:bg-muted rounded">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => handleDelete(row)} className="p-1 hover:bg-destructive/10 rounded">
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      </button>
    </>
  )}
  rowActionsWidth={70}
/>
```

**What you get**: Full toolbar (search, filter, columns, views, save, export). Group-by drop zone. Pagination. Selection checkboxes. Sticky action icons per row.

### Tier 4: Big Data (Virtualized)

For audit logs, sensor data, 10k+ row datasets.

```tsx
<MyDataGrid<LogEntry>
  rows={logs}
  columns={columns}
  rowKey="id"
  height="calc(100vh - 200px)"
  features={{
    sorting: true,
    filtering: true,
    virtualization: true,     // ← enables row virtualization
    pagination: true,         // ← mandatory with big data
    selection: 'multi',
  }}
  pageSize={100}
  pageSizeOptions={[50, 100, 500, 1000]}
/>
```

---

## 3. Full API Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `rows` | `TData[]` | The data array |
| `columns` | `GridColumn<TData>[]` | Column definitions (see §4) |
| `rowKey` | `string` | Field name used as unique row identifier |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | `false` | Shows loading overlay |
| `features` | `GridFeatures` | `{}` | Feature toggles (see §5) |
| `initialState` | `Partial<GridViewState>` | – | Initial sort/filter/group state, applied once |
| `globalFilter` | `string` | – | Controlled global search value |
| `savedViews` | `GridSavedView[]` | – | Preset view configurations |
| `height` | `number \| string` | `500` | Grid height in px or CSS |
| `rowHeight` | `number` | `40` | Row height in px |
| `headerHeight` | `number` | `36` | Header height in px |
| `toolbarPosition` | `'top' \| 'none'` | `'top'` | **Legacy** — prefer `features.toolbar` |
| `toolbarExtra` | `ReactNode` | – | Extra buttons injected into toolbar |
| `statusBar` | `boolean` | `true` | Show/hide footer (row count, pagination) |
| `filterRow` | `boolean` | `false` | Reserved for inline filter row mode |
| `pageSize` | `number` | `50` | Default rows per page |
| `pageSizeOptions` | `number[]` | `[25,50,100,200]` | Page size dropdown options |
| `rowActions` | `(row: TData) => ReactNode` | – | Render action icons per row (slot pattern) |
| `rowActionsWidth` | `number` | `60` | Width of the actions column |
| `className` | `string` | – | CSS class on root element |
| `emptyMessage` | `string` | `'Inga data'` | Message when rows is empty |
| `noResultsMessage` | `string` | `'Inga träffar'` | Message when filters produce no results |

### Event Props

| Prop | Type | Description |
|------|------|-------------|
| `onRowClick` | `(row, event) => void` | Single-click on a row |
| `onRowDoubleClick` | `(row, event) => void` | Double-click on a row — emits full row data |
| `onCellEdit` | `(rowKey, colId, newVal, oldVal) => void` | Cell inline edit completed |
| `onSelectionChange` | `(keys: string[]) => void` | Selected row keys changed |
| `onStateChange` | `(event: GridStateChangeEvent) => void` | Any grid state changed |
| `onSaveView` | `(state: GridViewState) => void` | User clicked "Save view" |

### Ref API (`GridApi<TData>`)

Use `useRef<GridApi<TData>>()` + `ref={gridRef}` to access:

```tsx
gridRef.current.getSelectedRows()     // TData[]
gridRef.current.getFilteredRows()     // TData[]
gridRef.current.exportCsv()           // triggers download
gridRef.current.clearSelection()
gridRef.current.clearFilters()
gridRef.current.scrollToRow(rowKey)
```

---

## 4. Column Definition (`GridColumn`)

```tsx
const columns: GridColumn<Transaction>[] = [
  {
    id: 'date',                           // required: unique ID
    field: 'date',                        // maps to row.date
    headerName: 'Datum',                  // display label
    width: 120,                           // initial width (px)
    filterType: 'date',                   // filter UI: 'text' | 'number' | 'date' | 'boolean' | 'enum'
    sortable: true,                       // default: true
    filterable: true,                     // default: true
    groupable: true,                      // default: true (false for numbers by convention)
  },
  {
    id: 'amount',
    field: 'amount',
    headerName: 'Belopp',
    filterType: 'number',
    aggregation: 'sum',                   // shown in group rows: 'count' | 'sum' | 'avg' | 'min' | 'max'
    valueFormatter: (v) => `${Number(v).toLocaleString('sv-SE')} kr`,
    cellRenderer: ({ value }) => (
      <span className={Number(value) < 0 ? 'text-red-400' : 'text-green-400'}>
        {Number(value).toLocaleString('sv-SE')} kr
      </span>
    ),
  },
  {
    id: 'status',
    field: 'status',
    headerName: 'Status',
    filterType: 'enum',
    filterEnumValues: ['Bokförd', 'Preliminär', 'Makulerad'],
    pinned: 'right',                      // sticky right column
  },
];
```

### Column Tips
- Set `filterType` to match the data type. This controls which operators appear in the Excel-style filter menu.
- Use `valueFormatter` for display formatting, `cellRenderer` for custom JSX cells.
- Use `valueGetter` when the display value differs from the raw data: `valueGetter: (row) => row.first + ' ' + row.last`.
- Set `hidden: true` for columns that should be available but not shown by default.
- Set `pinned: 'left' | 'right'` for columns that must stay visible during horizontal scroll.

---

## 5. Features Toggle (`GridFeatures`)

```tsx
interface GridFeatures {
  filtering?: boolean;             // Column filter menus + global search
  sorting?: boolean;               // Click-to-sort headers
  grouping?: boolean;              // Drag-to-group
  groupDropZone?: boolean;         // Show/hide the group-by drop zone (default: same as grouping)
  selection?: boolean | 'single' | 'multi';  // Row checkboxes
  virtualization?: boolean;        // DOM virtualization for 5k+ rows
  columnReordering?: boolean;      // Drag to reorder columns
  columnResizing?: boolean;        // Drag header edge to resize
  editing?: boolean;               // Double-click to inline edit
  pagination?: boolean;            // Client-side page nav

  toolbar?: {                      // Granular toolbar control
    search?: boolean;              // Global search input
    filter?: boolean;              // Filter toggle button
    columns?: boolean;             // Column visibility panel
    views?: boolean;               // Saved views picker
    export?: boolean;              // CSV export button
    save?: boolean;                // Save view button
  } | false;                       // false = hide entire toolbar
}
```

### Auto-hide Logic
- **Toolbar**: hidden when `features.toolbar === false` OR when all sub-toggles are `false`.
- **Group drop zone**: hidden when `features.grouping === false` OR `features.groupDropZone === false`.
- **Status bar**: hidden when `statusBar={false}`.
- **Selection checkboxes**: hidden when `features.selection` is `false` or unset.

---

## 6. Row Actions (Slot Pattern)

The `rowActions` prop replaces Vue's scoped slot pattern. It renders a **sticky right column** with custom action buttons per row.

```tsx
<MyDataGrid
  rowActions={(row) => (
    <>
      <button onClick={() => openDetail(row.id)} className="p-1 rounded hover:bg-muted" title="Visa">
        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button onClick={() => editRow(row)} className="p-1 rounded hover:bg-muted" title="Redigera">
        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button onClick={() => deleteRow(row.id)} className="p-1 rounded hover:bg-destructive/10" title="Ta bort">
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      </button>
    </>
  )}
  rowActionsWidth={90}
/>
```

- The actions column is always **sticky right** and has an opaque background.
- Click events on action buttons are **automatically stopped** from propagating to `onRowClick`.
- Set `rowActionsWidth` to fit your buttons (default: `60`px).

---

## 7. Double-Click Events

```tsx
<MyDataGrid
  onRowDoubleClick={(row) => {
    navigate(`/detail/${row.id}`);
    // or open a detail modal
  }}
/>
```

The double-click handler receives the full row data object. It fires even if `onRowClick` is also set.

---

## 8. Common Patterns

### Loading State
```tsx
<MyDataGrid rows={data ?? []} loading={isLoading} columns={columns} rowKey="id" />
```

### Saved Views with Supabase
```tsx
const views = useGridViews('finance-transactions');

<MyDataGrid
  savedViews={views}
  onSaveView={(state) => upsertGridView('finance-transactions', state)}
/>
```

### Bulk Actions with Selection
```tsx
const gridRef = useRef<GridApi<Transaction>>(null);

<button onClick={() => {
  const selected = gridRef.current?.getSelectedRows() ?? [];
  handleBulkDelete(selected.map(r => r.id));
  gridRef.current?.clearSelection();
}}>
  Ta bort valda
</button>

<MyDataGrid ref={gridRef} features={{ selection: 'multi' }} ... />
```

### Conditional Row Actions
```tsx
rowActions={(row) => (
  row.status === 'draft' ? (
    <button onClick={() => publish(row)}>Publicera</button>
  ) : null
)}
```

---

## 9. File Locations

| File | Purpose |
|------|---------|
| `src/core/shared/grid/public/MyDataGrid.tsx` | Entry point component |
| `src/core/shared/grid/public/gridTypes.ts` | All public type definitions |
| `src/core/shared/grid/public/gridApi.ts` | Imperative API (ref) |
| `src/core/shared/grid/hooks/useGridInstance.ts` | TanStack adapter (internal) |
| `src/core/shared/grid/rendering/GridShell.tsx` | Layout orchestrator (internal) |
| `src/core/shared/grid/rendering/GridToolbar.tsx` | Toolbar UI (internal) |
| `src/core/shared/grid/rendering/GridRow.tsx` | Row rendering (internal) |
| `src/core/shared/grid/rendering/GridHeader.tsx` | Header rendering (internal) |
| `src/core/shared/grid/styles/grid.css` | All grid CSS |
| `src/modules/grid-demo/pages/DemoPage.tsx` | Reference demo with all tiers |

---

## 10. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|--------|
| Import from `@tanstack/react-table` | Import from `@/core/shared/grid` |
| Enable all features on a 10-row table | Use Tier 1 (Display) |
| Build custom `<table>` for data display | Use `MyDataGrid` with minimal features |
| Use `toolbarPosition='none'` | Use `features: { toolbar: false }` |
| Duplicate column logic in cellRenderer | Use `valueFormatter` for text, `cellRenderer` for JSX |
| Forget `rowKey` or use non-unique field | Always pass a unique identifier field |
| Skip `filterType` on columns | Always set `filterType` to match data type |
