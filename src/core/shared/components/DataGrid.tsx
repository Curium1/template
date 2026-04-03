import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef, type GridReadyEvent, type GridApi } from 'ag-grid-community';
import type { AgGridReactProps } from 'ag-grid-react';

// Register community modules once
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Nordic Minimal theme for AG Grid.
 * Maps our design tokens to AG Grid's CSS variable system.
 */
export const nordicTheme = themeQuartz.withParams({
  backgroundColor: 'rgb(var(--card))',
  foregroundColor: 'rgb(var(--foreground))',
  headerBackgroundColor: 'rgb(var(--card))',
  headerForegroundColor: 'rgb(var(--muted-foreground))',
  headerFontSize: 11,
  headerFontWeight: 600,
  fontSize: 13,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
  borderColor: 'rgb(var(--border) / 0.5)',
  borderRadius: 12,
  rowBorder: false,
  columnBorder: false,
  headerColumnBorder: false,
  wrapperBorder: true,
  wrapperBorderRadius: 16,
  rowHeight: 48,
  headerHeight: 40,
  oddRowBackgroundColor: 'transparent',
  selectedRowBackgroundColor: 'rgb(var(--foreground) / 0.03)',
  rowHoverColor: 'rgb(var(--foreground) / 0.02)',
  cellHorizontalPadding: 20,
  spacing: 4,
});

/**
 * Reusable AG Grid wrapper with Nordic styling.
 *
 * Usage:
 * ```tsx
 * <DataGrid
 *   rowData={items}
 *   columnDefs={colDefs}
 *   height={400}
 * />
 * ```
 */
interface DataGridProps<TData> extends Omit<AgGridReactProps<TData>, 'theme'> {
  /** Grid height in px or CSS string. Default: 500 */
  height?: number | string;
  /** Optional callback when grid is ready */
  onGridReady?: (event: GridReadyEvent<TData>) => void;
}

export function DataGrid<TData>({
  height = 500,
  columnDefs,
  defaultColDef: userDefaultColDef,
  onGridReady,
  ...rest
}: DataGridProps<TData>) {
  const gridRef = useRef<AgGridReact<TData>>(null);

  const defaultColDef = useMemo<ColDef<TData>>(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    resizable: true,
    suppressHeaderMenuButton: true,
    ...userDefaultColDef,
  }), [userDefaultColDef]);

  const handleGridReady = useCallback((event: GridReadyEvent<TData>) => {
    event.api.sizeColumnsToFit();
    onGridReady?.(event);
  }, [onGridReady]);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div style={{ height: heightStyle, width: '100%' }}>
      <AgGridReact<TData>
        ref={gridRef}
        theme={nordicTheme}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
        animateRows={true}
        domLayout={rest.rowData && rest.rowData.length <= 20 ? 'autoHeight' : 'normal'}
        suppressCellFocus={true}
        suppressRowClickSelection={true}
        headerHeight={40}
        rowHeight={48}
        {...rest}
      />
    </div>
  );
}

export type { ColDef, GridApi, GridReadyEvent };
