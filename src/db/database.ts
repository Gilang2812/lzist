import Dexie, { type EntityTable } from 'dexie';
import type { Barang, SubBarang, Supplier, StokLog, RestockList } from '../types';

/**
 * Lzist IndexedDB database via Dexie.js.
 * Schema will grow as features are implemented.
 */
const db = new Dexie('LzistDB') as Dexie & {
  barang: EntityTable<Barang, 'id'>;
  subBarang: EntityTable<SubBarang, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
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

export { db };
