import { db } from './database';
import { supabase } from './supabase';

// Helper untuk mendapatkan Primary Key dari sebuah tabel
function getPrimaryKeys(tableName: string): string[] {
  const pkMap: Record<string, string[]> = {
    users: ['user_id'],
    product: ['product_code'],
    color: ['color_id'],
    product_color: ['product_id', 'color_id'],
    color_img: ['color_img_id'],
    restock: ['restock_id'],
    excel_file: ['file_id'],
    restock_item: ['restock_id', 'color_id'],
    unreg_product: ['sku'],
    unreg_variasi: ['sku'],
    sku: ['id_sku']
  };
  return pkMap[tableName] || ['id'];
}

// Helper untuk membandingkan apakah dua data berbeda
function isDataDifferent(dataA: any, dataB: any): boolean {
  if (!dataA || !dataB) return true;
  
  const keysA = Object.keys(dataA);
  const keysB = Object.keys(dataB);
  const allKeys = new Set([...keysA, ...keysB]);

  for (const key of allKeys) {
    // Normalisasi undefined menjadi null untuk memudahkan perbandingan
    const valA = dataA[key] ?? null;
    const valB = dataB[key] ?? null;
    if (valA !== valB) {
      return true;
    }
  }
  return false;
}

// Helper untuk menghapus antrean yang sudah kadaluarsa (dioverwrite oleh pull)
async function cleanUpSyncQueue(tableName: string, pks: string[], row: any) {
  const queue = await db.syncQueue.toArray(); // Ambil semua antrean
  for (const item of queue) {
    if (item.tableName === tableName) {
      let match = true;
      for (const pk of pks) {
        // Bandingkan dengan String() untuk menghindari masalah tipe data (number vs string)
        if (String(item.payload[pk]) !== String(row[pk])) {
          match = false;
          break;
        }
      }
      if (match) {
        await db.syncQueue.delete(item.id!);
      }
    }
  }
}

/**
 * SyncEngine: Menghandle Push (mengirim perubahan lokal ke Supabase)
 * dan Pull (menarik data baru dari Supabase ke lokal).
 */
export class SyncEngine {
  // Push perubahan dari Dexie (sync_queue) ke Supabase
  static async push() {
    if (!navigator.onLine) return;

    // Ambil semua item di antrean
    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        const { tableName, operation, payload } = item;
        const pks = getPrimaryKeys(tableName);
        
        if (operation === 'UPSERT') {
          // Cari data di Supabase berdasarkan PK
          let query = supabase.from(tableName).select('*');
          const pkMatch: Record<string, any> = {};
          
          for (const pk of pks) {
            query = query.eq(pk, payload[pk]);
            pkMatch[pk] = payload[pk];
          }

          const { data: remoteData, error: fetchError } = await query.maybeSingle();
          if (fetchError) throw fetchError;

          if (!remoteData) {
            // Data tidak ada di Supabase, simpan ulang (insert)
            const { error } = await supabase.from(tableName).insert(payload);
            if (error) throw error;
          } else {
            // Data ada di Supabase, cek apakah berbeda dengan lokal
            if (isDataDifferent(payload, remoteData)) {
              // Jika berbeda, update di Supabase sehingga sama dengan data lokal
              const { error } = await supabase.from(tableName).update(payload).match(pkMatch);
              if (error) throw error;
            }
          }
        } else if (operation === 'DELETE') {
          // Hapus langsung dari Supabase (Hard Delete)
          let deleteQuery = supabase.from(tableName).delete();
            
          for (const pk of pks) {
            deleteQuery = deleteQuery.eq(pk, payload[pk]);
          }
          
          const { error } = await deleteQuery;
          if (error) throw error;
        }

        // Jika berhasil, hapus dari antrean lokal
        await db.syncQueue.delete(item.id!);
      } catch (err) {
        console.error(`Gagal sync item ${item.id} ke tabel ${item.tableName}:`, err);
        // Bisa tambahkan logika retry atau biarkan saja (akan dicoba lagi nanti)
      }
    }
  }

  // Pull perubahan terbaru dari Supabase ke Dexie (Full Sync & Mirror)
  static async pull() {
    if (!navigator.onLine) return;

    const tablesToSync = [
      'users', 'product', 'color', 'product_color', 'restock', 'restock_item', 
      'unreg_product', 'unreg_variasi', 'sku', 'color_img', 'excel_file'
    ];

    for (const tableName of tablesToSync) {
      try {
        // Tarik data dengan chunking/pagination
        const pageSize = 200;
        const allData: any[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const to = from + pageSize - 1;
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(from, to);

          if (error) throw error;

          if (!data || data.length === 0) {
            hasMore = false;
          } else {
            allData.push(...data);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          }
        }

        const table = (db as any)[tableName];
        const pks = getPrimaryKeys(tableName);
        
        // 1. Dapatkan daftar ID yang ada di Supabase
        const remoteKeys = new Set(allData.map(row => 
          pks.length > 1 ? pks.map(k => String(row[k])).join('_') : String(row[pks[0]])
        ));

        // 2. Hapus data di Dexie yang sudah tidak ada di Supabase
        const localItems = await table.toArray();
        for (const localItem of localItems) {
          const localPkStr = pks.length > 1 ? pks.map(k => String(localItem[k])).join('_') : String(localItem[pks[0]]);
          if (!remoteKeys.has(localPkStr)) {
            const pkValue = pks.length > 1 ? pks.map(k => localItem[k]) : localItem[pks[0]];
            await table.delete(pkValue);
            await cleanUpSyncQueue(tableName, pks, localItem);
          }
        }

        // 3. Masukkan atau perbarui data dari Supabase ke Dexie
        for (const row of allData) {
          const pkValue = pks.length > 1 ? pks.map(k => row[k]) : row[pks[0]];
          const localData = await table.get(pkValue);
          
          // Jika data lokal belum ada, atau detail isi data berbeda dengan Supabase
          if (!localData || isDataDifferent(localData, row)) {
            await table.put(row);
            await cleanUpSyncQueue(tableName, pks, row);
          }
        }
      } catch (err) {
        console.error(`Gagal pull dari tabel ${tableName}:`, err);
      }
    }
  }

  // Fungsi helper untuk menambahkan operasi ke antrean Dexie
  static async enqueue(tableName: string, operation: 'UPSERT' | 'DELETE', payload: any) {
    await db.syncQueue.add({
      tableName,
      operation,
      payload,
      createdAt: new Date().toISOString()
    });
    
    // Langsung coba push (jika sedang online, akan langsung terkirim)
    this.push();
  }
}
