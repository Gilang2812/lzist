import { db } from '../db/database';
import { INITIAL_DATA } from '../data/restockInitialData';
import type { Barang, SubBarang } from '../types';
import { calculateHash } from './hash';

export const SYNC_HASH_KEY = 'LzistDB_DataHash';

export const syncDatabaseWithMaster = async () => {
  console.log('Sinkronisasi ulang database dengan INITIAL_DATA...');
  await db.transaction('rw', db.barang, db.subBarang, async () => {
    await db.barang.clear();
    await db.subBarang.clear();
    
    const barangData: Barang[] = [];
    const subBarangData: SubBarang[] = [];

    for (const category of INITIAL_DATA) {
      barangData.push({
        id: category.id,
        name: category.name,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      for (const variant of category.variants) {
        subBarangData.push({
          id: variant.id,
          barangId: category.id,
          name: variant.name,
          stock: variant.stock,
          images: variant.images
        });
      }
    }

    await db.barang.bulkAdd(barangData);
    await db.subBarang.bulkAdd(subBarangData);
  });
  
  const currentHash = calculateHash(JSON.stringify(INITIAL_DATA));
  localStorage.setItem(SYNC_HASH_KEY, currentHash);
  
  // Dispatch custom event to let the hook know the hash was updated
  window.dispatchEvent(new Event('lzist-db-synced'));
  
  console.log('Sinkronisasi selesai.');
};

export const initDb = async () => {
  try {
    const count = await db.barang.count();
    if (count === 0) {
      await syncDatabaseWithMaster();
    } else {
      if (!localStorage.getItem(SYNC_HASH_KEY)) {
        localStorage.setItem(SYNC_HASH_KEY, calculateHash(JSON.stringify(INITIAL_DATA)));
      }
    }
  } catch (error) {
    console.error('Gagal melakukan inisialisasi database:', error);
  }
};

