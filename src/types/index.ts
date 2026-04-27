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
}

export interface Category {
  id: string;
  name: string;
  variants: Variant[];
}

export interface RestockList {
  id: string;
  title: string;
  description?: string;
  categories: Category[];
  status: 'draft' | 'finalized' | 'completed';
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
  category?: string;
  description?: string;
  subBarang: SubBarang[];
  supplierId?: string;
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
