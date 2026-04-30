import Dexie, { type EntityTable } from 'dexie';
import type { Barang, SubBarang, Supplier, BarangSupplier, StokLog, RestockList } from '../types';

/**
 * Lzist IndexedDB database via Dexie.js.
 * v2: added barangSupplier junction table; removed category/description/supplierId from barang.
 */
const db = new Dexie('LzistDB') as Dexie & {
  barang: EntityTable<Barang, 'id'>;
  subBarang: EntityTable<SubBarang, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  barangSupplier: EntityTable<BarangSupplier, 'id'>;
  stokLogs: EntityTable<StokLog, 'id'>;
  restockLists: EntityTable<RestockList, 'id'>;
};

db.version(1).stores({
  barang: 'id, name, category, supplierId',
  subBarang: 'id, barangId, name, sku',
  suppliers: 'id, name',
  stokLogs: 'id, subBarangId, type, createdAt',
  restockLists: 'id, status, createdAt',
});

db.version(2).stores({
  barang: 'id, name',
  subBarang: 'id, barangId, name, sku',
  suppliers: 'id, name',
  barangSupplier: 'id, barangId, supplierId',
  stokLogs: 'id, subBarangId, type, createdAt',
  restockLists: 'id, status, createdAt',
});

export { db };
