/**
 * DemoPage — Polished, tabbed demo of MyDataGrid
 *
 * Three scenarios: Finance Transactions, Sales Orders, Large Dataset (10k)
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageHeader } from '../../../core/layout/usePageHeader';
import { MyDataGrid } from '../../../core/shared/grid';
import type { GridColumn, GridSavedView, GridApi, GridViewState } from '../../../core/shared/grid';
import {
  generateFinanceData,
  generateSalesData,
  generateLargeDataset,
  type FinanceTransaction,
  type SalesOrder,
  type LargeDataItem,
} from './demoData';

type TabId = 'finance' | 'sales' | 'large';

export function DemoPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('finance');

  usePageHeader({
    title: t('modules.grid_demo.name', 'DataGrid'),
    subtitle: t('modules.grid_demo.subtitle', 'Interaktiv demo av MyDataGrid-komponenten'),
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: 'finance', label: t('modules.grid_demo.tab.finance', 'Ekonomi') },
    { id: 'sales', label: t('modules.grid_demo.tab.sales', 'Försäljning') },
    { id: 'large', label: t('modules.grid_demo.tab.large', 'Stor dataset (10k)') },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 text-[13px] font-medium rounded-lg transition-all
              ${activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'finance' && <FinanceDemo />}
      {activeTab === 'sales' && <SalesDemo />}
      {activeTab === 'large' && <LargeDemo />}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Finance Demo
// ═══════════════════════════════════════════════════

function FinanceDemo() {
  const gridRef = useRef<GridApi<FinanceTransaction>>(null);
  const data = useMemo(() => generateFinanceData(200), []);

  const columns: GridColumn<FinanceTransaction>[] = useMemo(() => [
    { id: 'id', field: 'id', headerName: 'ID', width: 110, minWidth: 90, filterable: false, groupable: false },
    { id: 'date', field: 'date', headerName: 'Datum', filterType: 'date', width: 110 },
    { id: 'account', field: 'account', headerName: 'Konto', filterType: 'enum', width: 160 },
    { id: 'project', field: 'project', headerName: 'Projekt', filterType: 'enum', width: 120 },
    { id: 'division', field: 'division', headerName: 'Avdelning', filterType: 'enum', width: 110 },
    { id: 'category', field: 'category', headerName: 'Kategori', filterType: 'enum', width: 110 },
    {
      id: 'amount',
      field: 'amount',
      headerName: 'Belopp',
      filterType: 'number',
      width: 130,
      aggregation: 'sum',
      valueFormatter: (val) => {
        const num = Number(val);
        return new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      },
      cellRenderer: ({ value }) => {
        const num = Number(value);
        const formatted = new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
        return (
          <span className={`tabular-nums font-medium ${num < 0 ? 'text-red-500' : 'text-green-600'}`}>
            {formatted}
          </span>
        );
      },
    },
    { id: 'currency', field: 'currency', headerName: 'Valuta', filterType: 'enum', width: 80 },
    {
      id: 'status',
      field: 'status',
      headerName: 'Status',
      filterType: 'enum',
      width: 110,
      cellRenderer: ({ value }) => {
        const s = String(value);
        const colors: Record<string, string> = {
          'Bokförd': 'bg-green-500/10 text-green-600',
          'Attesterad': 'bg-blue-500/10 text-blue-600',
          'Preliminär': 'bg-amber-500/10 text-amber-600',
          'Makulerad': 'bg-red-500/10 text-red-500',
        };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[s] ?? 'bg-muted text-muted-foreground'}`}>
            {s}
          </span>
        );
      },
    },
    { id: 'description', field: 'description', headerName: 'Beskrivning', width: 250, minWidth: 150 },
  ], []);

  const savedViews: GridSavedView[] = useMemo(() => [
    { id: 'default', name: 'Standard', state: {} },
    {
      id: 'grouped-account',
      name: 'Per konto',
      state: { grouping: ['account'] },
    },
    {
      id: 'high-value',
      name: 'Höga belopp',
      state: {
        sorting: [{ columnId: 'amount', direction: 'desc' }],
        filters: [{ columnId: 'amount', operator: 'gt', value: 50000 }],
      },
    },
    {
      id: 'grouped-division',
      name: 'Per avdelning',
      state: { grouping: ['division'] },
    },
  ], []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[14px] font-semibold text-foreground">Ekonomitransaktioner</h2>
        <span className="text-[12px] text-muted-foreground">{data.length} rader</span>
      </div>
      <MyDataGrid<FinanceTransaction>
        ref={gridRef}
        rows={data}
        columns={columns}
        rowKey="id"
        height={520}
        rowHeight={40}
        headerHeight={36}
        features={{
          filtering: true,
          sorting: true,
          grouping: true,
          selection: 'multi',
          columnResizing: true,
          editing: true,
          virtualization: false,
          pagination: true,
        }}
        filterRow={false}
        savedViews={savedViews}
        onSaveView={(state) => console.log('Save view:', state)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Sales Demo
// ═══════════════════════════════════════════════════

function SalesDemo() {
  const data = useMemo(() => generateSalesData(150), []);

  const columns: GridColumn<SalesOrder>[] = useMemo(() => [
    { id: 'orderNo', field: 'orderNo', headerName: 'Ordernr', width: 130, groupable: false },
    { id: 'orderDate', field: 'orderDate', headerName: 'Datum', filterType: 'date', width: 110 },
    { id: 'customer', field: 'customer', headerName: 'Kund', filterType: 'enum', width: 150 },
    { id: 'region', field: 'region', headerName: 'Region', filterType: 'enum', width: 100 },
    { id: 'salesperson', field: 'salesperson', headerName: 'Säljare', filterType: 'enum', width: 110 },
    { id: 'product', field: 'product', headerName: 'Produkt', filterType: 'enum', width: 140 },
    {
      id: 'quantity',
      field: 'quantity',
      headerName: 'Antal',
      filterType: 'number',
      width: 80,
      aggregation: 'sum',
      className: 'tabular-nums text-right',
    },
    {
      id: 'total',
      field: 'total',
      headerName: 'Totalt',
      filterType: 'number',
      width: 130,
      aggregation: 'sum',
      cellRenderer: ({ value }) => {
        const formatted = new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(value));
        return <span className="tabular-nums font-medium">{formatted}</span>;
      },
    },
    {
      id: 'status',
      field: 'status',
      headerName: 'Status',
      filterType: 'enum',
      width: 110,
      cellRenderer: ({ value }) => {
        const s = String(value);
        const colors: Record<string, string> = {
          'Ny': 'bg-blue-500/10 text-blue-600',
          'Bekräftad': 'bg-cyan-500/10 text-cyan-600',
          'Levererad': 'bg-violet-500/10 text-violet-600',
          'Fakturerad': 'bg-amber-500/10 text-amber-600',
          'Betald': 'bg-green-500/10 text-green-600',
          'Avbruten': 'bg-red-500/10 text-red-500',
        };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[s] ?? 'bg-muted text-muted-foreground'}`}>
            {s}
          </span>
        );
      },
    },
    {
      id: 'priority',
      field: 'priority',
      headerName: 'Prioritet',
      filterType: 'enum',
      width: 100,
      cellRenderer: ({ value }) => {
        const s = String(value);
        const colors: Record<string, string> = {
          'Låg': 'text-muted-foreground',
          'Medium': 'text-foreground',
          'Hög': 'text-amber-600 font-semibold',
          'Kritisk': 'text-red-500 font-bold',
        };
        return <span className={`text-[12px] ${colors[s] ?? ''}`}>{s}</span>;
      },
    },
  ], []);

  const savedViews: GridSavedView[] = useMemo(() => [
    { id: 'default', name: 'Standard', state: {} },
    {
      id: 'by-status-sales',
      name: 'Per status → säljare',
      state: { grouping: ['status', 'salesperson'] },
    },
    {
      id: 'high-priority',
      name: 'Hög prioritet',
      state: {
        filters: [{ columnId: 'priority', operator: 'in', value: ['Hög', 'Kritisk'] }],
        sorting: [{ columnId: 'total', direction: 'desc' }],
      },
    },
  ], []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[14px] font-semibold text-foreground">Försäljningsordrar</h2>
        <span className="text-[12px] text-muted-foreground">{data.length} rader</span>
      </div>
      <MyDataGrid<SalesOrder>
        rows={data}
        columns={columns}
        rowKey="id"
        height={520}
        rowHeight={40}
        headerHeight={36}
        features={{
          filtering: true,
          sorting: true,
          grouping: true,
          selection: 'multi',
          columnResizing: true,
        }}
        savedViews={savedViews}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Large Dataset Demo (10k rows)
// ═══════════════════════════════════════════════════

function LargeDemo() {
  const data = useMemo(() => generateLargeDataset(10000), []);

  const columns: GridColumn<LargeDataItem>[] = useMemo(() => [
    { id: 'id', field: 'id', headerName: 'ID', width: 110, groupable: false },
    { id: 'name', field: 'name', headerName: 'Namn', width: 160 },
    { id: 'email', field: 'email', headerName: 'E-post', width: 220, groupable: false },
    { id: 'department', field: 'department', headerName: 'Avdelning', filterType: 'enum', width: 120 },
    { id: 'role', field: 'role', headerName: 'Nivå', filterType: 'enum', width: 100 },
    {
      id: 'salary',
      field: 'salary',
      headerName: 'Lön',
      filterType: 'number',
      width: 120,
      aggregation: 'avg',
      cellRenderer: ({ value }) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat('sv-SE').format(Number(value))} kr
        </span>
      ),
    },
    { id: 'startDate', field: 'startDate', headerName: 'Startdatum', filterType: 'date', width: 110 },
    {
      id: 'active',
      field: 'active',
      headerName: 'Aktiv',
      filterType: 'boolean',
      width: 80,
      cellRenderer: ({ value }) => (
        <span className={`inline-block w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
      ),
    },
    {
      id: 'rating',
      field: 'rating',
      headerName: 'Betyg',
      filterType: 'number',
      width: 100,
      cellRenderer: ({ value }) => {
        const n = Number(value);
        return (
          <span className="text-[12px] tabular-nums">
            {'★'.repeat(n)}{'☆'.repeat(5 - n)}
          </span>
        );
      },
    },
    { id: 'location', field: 'location', headerName: 'Plats', filterType: 'enum', width: 110 },
  ], []);

  const savedViews: GridSavedView[] = useMemo(() => [
    { id: 'default', name: 'Standard', state: {} },
    {
      id: 'by-dept',
      name: 'Per avdelning',
      state: { grouping: ['department'] },
    },
    {
      id: 'active-only',
      name: 'Bara aktiva',
      state: {
        filters: [{ columnId: 'active', operator: 'isTrue', value: true }],
      },
    },
  ], []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[14px] font-semibold text-foreground">Stor dataset</h2>
        <span className="text-[12px] text-muted-foreground">{data.length.toLocaleString('sv')} rader • Virtualiserad</span>
      </div>
      <MyDataGrid<LargeDataItem>
        rows={data}
        columns={columns}
        rowKey="id"
        height={520}
        rowHeight={40}
        headerHeight={36}
        features={{
          filtering: true,
          sorting: true,
          grouping: true,
          selection: 'multi',
          columnResizing: true,
          virtualization: true,
        }}
        savedViews={savedViews}
      />
    </div>
  );
}
