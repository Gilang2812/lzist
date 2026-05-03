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
  variants: Variant[];
  supplierNames?: string[];
}

export interface ImportRecord {
  id: string;
  filename: string;
  categories: Category[];
  importedAt: Date;
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
  price?: number;
  images?: string[];
}

export interface Barang {
  id: string;
  name: string;
  supplierIds?: string[];
  subBarang?: SubBarang[];
  createdAt: Date;
  updatedAt: Date;
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
