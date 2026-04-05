/**
 * Demo Data Generators
 *
 * Generates realistic datasets for the grid demo page.
 */

// ─── Finance Transactions ───

export interface FinanceTransaction {
  id: string;
  date: string;
  account: string;
  project: string;
  division: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  category: string;
}

const ACCOUNTS = ['1910 Kassa', '1920 PlusGiro', '1930 Bankgiro', '2440 Leverantörer', '3010 Intäkter', '3020 Tjänsteintäkter', '4010 Material', '5010 Lokalhyra', '6110 Kontorsmaterial', '7010 Löner'];
const PROJECTS = ['P-2024-001', 'P-2024-002', 'P-2024-003', 'P-2024-004', 'P-2024-005', 'P-2024-006'];
const DIVISIONS = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping'];
const CURRENCIES = ['SEK', 'EUR', 'USD'];
const STATUSES = ['Bokförd', 'Preliminär', 'Makulerad', 'Attesterad'];
const CATEGORIES = ['Inköp', 'Försäljning', 'Löner', 'Hyra', 'Övrigt', 'Investering'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function generateFinanceData(count: number): FinanceTransaction[] {
  const data: FinanceTransaction[] = [];
  const start = new Date('2024-01-01');
  const end = new Date('2025-12-31');

  for (let i = 0; i < count; i++) {
    const isCredit = Math.random() > 0.4;
    data.push({
      id: `FIN-${String(i + 1).padStart(5, '0')}`,
      date: randomDate(start, end),
      account: randomFrom(ACCOUNTS),
      project: randomFrom(PROJECTS),
      division: randomFrom(DIVISIONS),
      amount: isCredit ? randomAmount(100, 500000) : -randomAmount(100, 200000),
      currency: randomFrom(CURRENCIES),
      status: randomFrom(STATUSES),
      description: `Transaktion ${i + 1} — ${randomFrom(['Faktura', 'Betalning', 'Kreditering', 'Justering', 'Överföring'])}`,
      category: randomFrom(CATEGORIES),
    });
  }

  return data.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Sales Orders ───

export interface SalesOrder {
  id: string;
  orderNo: string;
  customer: string;
  region: string;
  salesperson: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  orderDate: string;
  priority: string;
}

const CUSTOMERS = ['Volvo AB', 'IKEA', 'H&M Group', 'Ericsson', 'Spotify', 'Klarna', 'Atlas Copco', 'Sandvik', 'SKF', 'Electrolux', 'Essity', 'Hexagon', 'Husqvarna', 'NCC', 'Telia'];
const REGIONS = ['Norra', 'Södra', 'Västra', 'Östra', 'Central'];
const SALESPERSONS = ['Anna L.', 'Erik S.', 'Maria K.', 'Johan B.', 'Sofia N.', 'Anders P.'];
const PRODUCTS = ['Licens Pro', 'Licens Enterprise', 'Support Basic', 'Support Premium', 'Konsulttimmar', 'Utbildning', 'Integration'];
const ORDER_STATUSES = ['Ny', 'Bekräftad', 'Levererad', 'Fakturerad', 'Betald', 'Avbruten'];
const PRIORITIES = ['Låg', 'Medium', 'Hög', 'Kritisk'];

export function generateSalesData(count: number): SalesOrder[] {
  const data: SalesOrder[] = [];
  const start = new Date('2024-06-01');
  const end = new Date('2025-12-31');

  for (let i = 0; i < count; i++) {
    const qty = Math.ceil(Math.random() * 50);
    const price = randomAmount(500, 50000);
    data.push({
      id: `SO-${String(i + 1).padStart(5, '0')}`,
      orderNo: `ORD-${2024}-${String(i + 1).padStart(4, '0')}`,
      customer: randomFrom(CUSTOMERS),
      region: randomFrom(REGIONS),
      salesperson: randomFrom(SALESPERSONS),
      product: randomFrom(PRODUCTS),
      quantity: qty,
      unitPrice: price,
      total: Math.round(qty * price * 100) / 100,
      status: randomFrom(ORDER_STATUSES),
      orderDate: randomDate(start, end),
      priority: randomFrom(PRIORITIES),
    });
  }

  return data.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
}

// ─── Large Dataset ───

export interface LargeDataItem {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
  active: boolean;
  rating: number;
  location: string;
}

const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Product', 'Support', 'Legal'];
const ROLES = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP'];
const LOCATIONS = ['Stockholm', 'Göteborg', 'Malmö', 'London', 'Berlin', 'Helsinki', 'Oslo', 'København'];
const FIRST_NAMES = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Elias', 'Maja', 'William', 'Ella', 'Lucas', 'Astrid', 'Oscar', 'Saga', 'Hugo', 'Freja', 'Viktor', 'Agnes', 'Axel', 'Alma', 'Filip'];
const LAST_NAMES = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Pettersson', 'Gustafsson', 'Jonsson', 'Lindqvist', 'Lindström', 'Jakobsson'];

export function generateLargeDataset(count: number): LargeDataItem[] {
  const data: LargeDataItem[] = [];
  const start = new Date('2015-01-01');
  const end = new Date('2025-12-31');

  for (let i = 0; i < count; i++) {
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    data.push({
      id: `EMP-${String(i + 1).padStart(6, '0')}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@company.se`,
      department: randomFrom(DEPARTMENTS),
      role: randomFrom(ROLES),
      salary: Math.round(randomAmount(25000, 120000) / 1000) * 1000,
      startDate: randomDate(start, end),
      active: Math.random() > 0.15,
      rating: Math.round(Math.random() * 4 + 1),
      location: randomFrom(LOCATIONS),
    });
  }

  return data;
}
