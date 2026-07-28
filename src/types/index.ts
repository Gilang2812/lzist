// ─── Restock ────────────────────────────────────────────────
export interface Variant {
  id: string;
  name: string;
  stock: number;
  targetQuantity?: number;
  color?: string;
  outOfStock?: boolean;
  stores?: string[];
  images?: string[];
  checked?: boolean;
}

export interface Category {
  id: string;
  name: string;
  skus?: string[];
  variants: Variant[];
  supplierNames?: string[];
  price?: number;
}

export interface UnmatchedRow {
  productName: string;
  variantName: string;
  reason: string;
  quantity?: number;
  price?: number;
  checked?: boolean;
  filename?: string;
}

export interface ImportRecord {
  id: string;
  filename: string;
  categories: Category[];
  importedAt: Date;
  unmatchedRows?: UnmatchedRow[];
}

export interface RestockList {
  id: string;
  title: string;
  description?: string;
  categories: Category[];
  status: 'draft' | 'finalized' | 'completed';
  importedFiles?: string[];
  importHistory?: ImportRecord[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Katalog ────────────────────────────────────────────────
export interface SubBarang {
  id: string;
  barangId: string;
  name: string;
  sku?: string;
  stock: number;
  minStock?: number;
  images?: string[];
}

export interface Barang {
  id: string;
  name: string;
  skus?: string[];
  supplierIds?: string[];
  subBarang?: SubBarang[];
  createdAt: Date;
  updatedAt: Date;
  price?: number;
}

// ─── Supplier ───────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
}

// ─── Barang ↔ Supplier (many-to-many junction) ──────────────
export interface BarangSupplier {
  id: string;
  barangId: string;
  supplierId: string;
}

// ─── Stok Log ───────────────────────────────────────────────
export type StokLogType = 'masuk' | 'keluar';

export interface StokLog {
  id: string;
  subBarangId: string;
  type: StokLogType;
  quantity: number;
  note?: string;
  createdAt: Date;
}

// ─── Profit Calculator ────────────────────────────────────────

export interface OrderItem {
  noPesanan: string;
  namaProduk: string;
  variasi: string;
  hargaSetelahDiskon: number;
  jumlah: number;
  subtotalBarang: number;
  itemKey: string;
}

export interface OrderGroup {
  noPesanan: string;
  items: OrderItem[];
  totalSubtotalBarang: number;
}

export interface ProfitHistory {
  id: string;
  title: string;
  startDate: { day: string; month: string; year: string };
  endDate: { day: string; month: string; year: string };
  orders: OrderGroup[];
  masterModal: Record<string, number>;
  overrides: Record<string, number>;
  adminFeePercent: number;
  serviceFeePercent: number;
  orderFeeAmount: number;
  adsFeeAmount: number;
  adsTaxPercent: number;
  affiliateFeeAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
