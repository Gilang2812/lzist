import Dexie, { type EntityTable } from 'dexie';
import type { Barang, SubBarang, Supplier, BarangSupplier, StokLog, RestockList, ProfitHistory } from '../types';

/**
 * Lzist IndexedDB database via Dexie.js.
 * v2: added barangSupplier junction table; removed category/description/supplierId from barang.
 */
const db = new Dexie('LzistDB_v2') as Dexie & {
  // Old tables (for UI compatibility while migrating)
  barang: EntityTable<Barang, 'id'>;
  subBarang: EntityTable<SubBarang, 'id'>;
  suppliers: EntityTable<Supplier, 'id'>;
  barangSupplier: EntityTable<BarangSupplier, 'id'>;
  stokLogs: EntityTable<StokLog, 'id'>;
  restockLists: EntityTable<RestockList, 'id'>;
  profitHistories: EntityTable<ProfitHistory, 'id'>;

  // New tables from lzist.drawio
  users: EntityTable<any, 'user_id'>;
  product: EntityTable<any, 'product_code'>;
  color: EntityTable<any, 'color_id'>;
  product_color: EntityTable<any, 'id'>;
  color_img: EntityTable<any, 'color_img_id'>;
  restock: EntityTable<any, 'restock_id'>;
  excel_file: EntityTable<any, 'file_id'>;
  restock_item: EntityTable<any, 'id'>; // Composite key handled as id or array
  unreg_product: EntityTable<any, 'sku'>;
  unreg_variasi: EntityTable<any, 'sku'>;
  sku: EntityTable<any, 'id_sku'>;

  // Sync Queue for Offline-First Architecture
  syncQueue: EntityTable<{
    id?: number;
    tableName: string;
    operation: 'UPSERT' | 'DELETE';
    payload: any;
    createdAt: string;
  }, 'id'>;
};

// ... keep versions 1-4 intact ...
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

db.version(3).stores({
  barang: 'id, name, *skus',
  subBarang: 'id, barangId, name, sku',
  suppliers: 'id, name',
  barangSupplier: 'id, barangId, supplierId',
  stokLogs: 'id, subBarangId, type, createdAt',
  restockLists: 'id, status, createdAt',
});

db.version(4).stores({
  barang: 'id, name, *skus',
  subBarang: 'id, barangId, name, sku',
  suppliers: 'id, name',
  barangSupplier: 'id, barangId, supplierId',
  stokLogs: 'id, subBarangId, type, createdAt',
  restockLists: 'id, status, createdAt',
  profitHistories: 'id, title, createdAt',
});

// Version 5: Adding new schema & syncQueue
db.version(5).stores({
  product: 'product_code, updated_at',
  color: 'color_id, product_code, updated_at',
  color_img: 'color_img_id, color_id, updated_at',
  restock: 'restock_id, updated_at',
  excel_file: 'file_id, updated_at',
  restock_item: '[restock_id+color_id], restock_id, color_id, updated_at',
  unreg_product: 'sku, restock_id, updated_at',
  unreg_variasi: 'sku, file_id, updated_at',
  sku: 'id_sku, product_code, updated_at',
  syncQueue: '++id, tableName, createdAt'
});

// Version 6: Adding users table and user_id to product & restock
db.version(6).stores({
  users: 'user_id, updated_at',
  product: 'product_code, user_id, updated_at',
  color: 'color_id, product_code, updated_at',
  color_img: 'color_img_id, color_id, updated_at',
  restock: 'restock_id, user_id, updated_at',
  excel_file: 'file_id, updated_at',
  restock_item: '[restock_id+color_id], restock_id, color_id, updated_at',
  unreg_product: 'sku, restock_id, updated_at',
  unreg_variasi: 'sku, file_id, updated_at',
  sku: 'id_sku, product_code, updated_at',
  syncQueue: '++id, tableName, createdAt'
});

// Version 7: Many-to-Many relation product and color via product_color
db.version(7).stores({
  users: 'user_id, updated_at',
  product: 'product_code, user_id, updated_at',
  color: 'color_id, updated_at',
  product_color: '[product_code+color_id], product_code, color_id, updated_at',
  color_img: 'color_img_id, color_id, updated_at',
  restock: 'restock_id, user_id, updated_at',
  excel_file: 'file_id, updated_at',
  restock_item: '[restock_id+color_id], restock_id, color_id, updated_at',
  unreg_product: 'sku, restock_id, updated_at',
  unreg_variasi: 'sku, file_id, updated_at',
  sku: 'id_sku, product_code, updated_at',
  syncQueue: '++id, tableName, createdAt'
});

// Version 8: Align product_color and color_img with Supabase schema (product_id instead of product_code)
db.version(8).stores({
  users: 'user_id, updated_at',
  product: 'product_code, user_id, updated_at',
  color: 'color_id, updated_at',
  product_color: '[product_id+color_id], product_id, color_id, updated_at',
  color_img: 'color_img_id, product_id, color_id, updated_at',
  restock: 'restock_id, user_id, updated_at',
  excel_file: 'file_id, updated_at',
  restock_item: '[restock_id+color_id], restock_id, color_id, updated_at',
  unreg_product: 'sku, restock_id, updated_at',
  unreg_variasi: 'sku, file_id, updated_at',
  sku: 'id_sku, product_code, updated_at',
  syncQueue: '++id, tableName, createdAt'
});

// Version 9: Index userId on restockLists
db.version(9).stores({
  restockLists: 'id, userId, status, createdAt',
});

export { db };
