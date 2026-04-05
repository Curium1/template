/**
 * GridToolbar — Search, filter chips, grouping controls, column visibility, view management
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, Filter, Columns3, SlidersHorizontal,
  ChevronDown, ChevronUp, Save, Download, Eye, EyeOff,
  Trash2, ChevronsUpDown,
} from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { getColumnLabel, getGridColumn } from '../adapter/columnAdapter';
import type { GridColumn, GridViewState, GridSavedView, GridFeatures } from '../public/gridTypes';
import type { ReactNode } from 'react';

interface GridToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  columns: GridColumn<TData>[];
  features: GridFeatures;
  savedViews?: GridSavedView[];
  onRestoreView?: (state: Partial<GridViewState>) => void;
  onSaveView?: (state: GridViewState) => void;
  getViewState: () => GridViewState;
  onExportCsv?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  toolbarExtra?: ReactNode;
  filterRow?: boolean;
  onToggleFilterRow?: () => void;
}

export function GridToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  features,
  savedViews,
  onRestoreView,
  onSaveView,
  getViewState,
  onExportCsv,
  onExpandAll,
  onCollapseAll,
  toolbarExtra,
  filterRow,
  onToggleFilterRow,
}: GridToolbarProps<TData>) {
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [showViewPanel, setShowViewPanel] = useState(false);
  const columnPanelRef = useRef<HTMLDivElement>(null);
  const viewPanelRef = useRef<HTMLDivElement>(null);

  // Close panels on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (columnPanelRef.current && !columnPanelRef.current.contains(e.target as Node)) {
        setShowColumnPanel(false);
      }
      if (viewPanelRef.current && !viewPanelRef.current.contains(e.target as Node)) {
        setShowViewPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Active filters
  const columnFilters = table.getState().columnFilters;
  const hasFilters = columnFilters.length > 0 || globalFilter !== '';

  // Active grouping
  const grouping = table.getState().grouping;
  const hasGrouping = grouping.length > 0;

  // Resolve toolbar sub-toggles (default: all visible)
  const tb = typeof features.toolbar === 'object' ? features.toolbar : {};
  const showSearch = tb.search !== false;
  const showFilter = tb.filter !== false && features.filtering;
  const showColumns = tb.columns !== false;
  const showViews = tb.views !== false;
  const showSave = tb.save !== false;
  const showExport = tb.export !== false;

  return (
    <div className="flex flex-col gap-0 border-b border-border/40">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="text"
              value={globalFilter}
              onChange={e => onGlobalFilterChange(e.target.value)}
              placeholder="Sök..."
              className="w-full pl-8 pr-8 py-1.5 text-[12px] rounded-lg bg-secondary/50 border border-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring/20 focus:bg-background"
            />
            {globalFilter && (
              <button
                onClick={() => onGlobalFilterChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Filter row toggle */}
          {showFilter && (
            <ToolbarButton
              icon={<Filter className="w-3.5 h-3.5" />}
              label="Filter"
              active={!!filterRow}
              onClick={onToggleFilterRow}
              badge={columnFilters.length > 0 ? columnFilters.length : undefined}
            />
          )}

          {/* Clear all filters */}
          {hasFilters && (
            <button
              onClick={() => {
                table.setColumnFilters([]);
                onGlobalFilterChange('');
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Rensa filter
            </button>
          )}

          {/* Grouping controls */}
          {features.grouping && hasGrouping && (
            <div className="flex items-center gap-1">
              <button onClick={onExpandAll} className="p-1 rounded hover:bg-muted" title="Expandera alla">
                <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Column visibility */}
          {showColumns && (
            <div className="relative" ref={columnPanelRef}>
              <ToolbarButton
                icon={<Columns3 className="w-3.5 h-3.5" />}
                label="Kolumner"
                active={showColumnPanel}
                onClick={() => { setShowColumnPanel(!showColumnPanel); setShowViewPanel(false); }}
              />
              {showColumnPanel && (
                <ColumnVisibilityPanel table={table} />
              )}
            </div>
          )}

          {/* Saved views */}
          {showViews && savedViews && savedViews.length > 0 && (
            <div className="relative" ref={viewPanelRef}>
              <ToolbarButton
                icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                label="Vyer"
                active={showViewPanel}
                onClick={() => { setShowViewPanel(!showViewPanel); setShowColumnPanel(false); }}
              />
              {showViewPanel && (
                <ViewPanel
                  savedViews={savedViews}
                  onRestoreView={(state) => { onRestoreView?.(state); setShowViewPanel(false); }}
                />
              )}
            </div>
          )}

          {/* Save current view */}
          {showSave && onSaveView && (
            <ToolbarButton
              icon={<Save className="w-3.5 h-3.5" />}
              label="Spara"
              onClick={() => onSaveView(getViewState())}
            />
          )}

          {/* Export CSV */}
          {showExport && onExportCsv && (
            <ToolbarButton
              icon={<Download className="w-3.5 h-3.5" />}
              label="Exportera"
              onClick={onExportCsv}
            />
          )}

          {/* Extra toolbar content */}
          {toolbarExtra}
        </div>
      </div>

      {/* Grouping chips — handled by GroupDropZone, removed from toolbar */}

      {/* Active filter chips */}
      {columnFilters.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-border/20">
          <Filter className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          {columnFilters.map(f => {
            const col = table.getColumn(f.id);
            const label = col ? getColumnLabel(col.columnDef.meta) : f.id;
            const val = f.value as { operator?: string; value?: unknown } | undefined;
            return (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 text-[11px] text-foreground/70"
              >
                <span className="text-muted-foreground/60">{label}:</span>
                <span className="font-medium truncate max-w-[100px]">
                  {val?.value != null ? String(val.value) : val?.operator ?? ''}
                </span>
                <button
                  onClick={() => col?.setFilterValue(undefined)}
                  className="p-0.5 rounded-full hover:bg-foreground/10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function ToolbarButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors
        ${active
          ? 'bg-foreground/10 text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function ColumnVisibilityPanel<TData>({ table }: { table: Table<TData> }) {
  const allColumns = table.getAllLeafColumns().filter(c => c.id !== 'select');

  return (
    <div className="absolute right-0 top-full mt-1 z-50 w-56 py-2 rounded-xl bg-card border border-border/50 shadow-xl">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
        Synliga kolumner
      </div>
      <div className="max-h-[300px] overflow-auto">
        {allColumns.map(column => {
          const label = getColumnLabel(column.columnDef.meta) || column.id;
          const isVisible = column.getIsVisible();
          return (
            <label
              key={column.id}
              className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={column.getToggleVisibilityHandler()}
                className="w-3.5 h-3.5 rounded border-border accent-foreground"
              />
              <span className={`text-[12px] ${isVisible ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {label}
              </span>
              {isVisible ? (
                <Eye className="w-3 h-3 text-muted-foreground/30 ml-auto" />
              ) : (
                <EyeOff className="w-3 h-3 text-muted-foreground/20 ml-auto" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ViewPanel({
  savedViews,
  onRestoreView,
}: {
  savedViews: GridSavedView[];
  onRestoreView: (state: Partial<GridViewState>) => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-1 z-50 w-52 py-2 rounded-xl bg-card border border-border/50 shadow-xl">
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
        Sparade vyer
      </div>
      {savedViews.map(view => (
        <button
          key={view.id}
          onClick={() => onRestoreView(view.state)}
          className="w-full text-left px-3 py-2 text-[12px] text-foreground hover:bg-muted/50 transition-colors"
        >
          {view.name}
        </button>
      ))}
    </div>
  );
}
