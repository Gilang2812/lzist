import { supabase } from '../db/supabase';
import type { RestockList } from '../types';
import { db } from '../db/database';

export const syncRestockToSupabase = async (list: RestockList, userId?: string) => {
  try {
    const activeUserId = userId || list.userId || null;

    // 0. Upsert Excel Files
    const filesPayload: any[] = [];
    if (list.importHistory && list.importHistory.length > 0) {
      list.importHistory.forEach(record => {
        filesPayload.push({
          file_id: record.id,
          filename: record.filename,
          updated_at: new Date().toISOString()
        });
      });
      const { error: filesError } = await supabase.from('excel_file').upsert(filesPayload);
      if (filesError) throw filesError;
    }

    // 1. Upsert Restock Header
    const { error: headerError } = await supabase.from('restock').upsert({
      restock_id: list.id,
      user_id: activeUserId,
      title: list.title || 'Untitled Restock',
      tanggal: new Date().toISOString().split('T')[0], // yyyy-mm-dd
      updated_at: new Date().toISOString()
    });
    
    if (headerError) throw headerError;

    // 2. Prepare Restock Items
    const itemsPayload: any[] = [];
    list.categories.forEach(cat => {
      cat.variants.forEach(variant => {
        if ((variant.targetQuantity || 0) > 0) {
          // color_id ada di format "productCode_colorId" atau bisa jadi variant.id itu sendiri jika bukan composite
          let colorId = variant.id;
          const underscoreIndex = variant.id.indexOf('_');
          if (underscoreIndex !== -1) {
            colorId = variant.id.substring(underscoreIndex + 1);
          }

          itemsPayload.push({
            restock_id: list.id,
            product_code: cat.id,
            color_id: colorId,
            demand: variant.targetQuantity,
            ischecked: variant.checked || false,
            updated_at: new Date().toISOString()
          });
        }
      });
    });

    if (itemsPayload.length > 0) {
      await supabase.from('restock_item').delete().eq('restock_id', list.id);
      
      const { error: itemsError } = await supabase.from('restock_item').insert(itemsPayload);
      if (itemsError) throw itemsError;
    }

    // 3. Prepare Unregistered Items
    const unregProducts: any[] = [];
    const unregVariations: any[] = [];
    let unregCount = 1;

    list.importHistory?.forEach(record => {
      record.unmatchedRows?.forEach(row => {
        if ((row.quantity || 0) > 0) {
          const fakeSku = `UNREG_${list.id}_${unregCount++}`;
          
          unregProducts.push({
            sku: fakeSku,
            restock_id: list.id,
            name: row.productName,
            updated_at: new Date().toISOString()
          });

          unregVariations.push({
            sku: fakeSku,
            warna: row.variantName || 'Unknown',
            demand: row.quantity,
            file_id: record.id,
            updated_at: new Date().toISOString()
          });
        }
      });
    });

    if (unregProducts.length > 0) {
      await supabase.from('unreg_product').delete().eq('restock_id', list.id);
      const { error: unregProdError } = await supabase.from('unreg_product').insert(unregProducts);
      if (unregProdError) throw unregProdError;

      const { error: unregVarError } = await supabase.from('unreg_variasi').insert(unregVariations);
      if (unregVarError) throw unregVarError;
    }

    // 4. Update local status
    const updatedList = {
      ...list,
      userId: activeUserId || undefined,
      status: 'finalized' as const,
      updatedAt: new Date()
    };
    await db.restockLists.put(updatedList);

    return { success: true, list: updatedList };
  } catch (error: any) {
    console.error('Sync Restock Error:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan' };
  }
};

export const syncRestockChecklistToSupabase = async (list: RestockList) => {
  try {
    const updates: Promise<any>[] = [];
    list.categories.forEach(cat => {
      cat.variants.forEach(variant => {
        let colorId = variant.id;
        const underscoreIndex = variant.id.indexOf('_');
        if (underscoreIndex !== -1) {
          colorId = variant.id.substring(underscoreIndex + 1);
        }

        updates.push(
          Promise.resolve(
            supabase
              .from('restock_item')
              .update({ ischecked: Boolean(variant.checked), updated_at: new Date().toISOString() })
              .eq('restock_id', list.id)
              .eq('product_code', cat.id)
              .eq('color_id', colorId)
          )
        );
      });
    });

    await Promise.all(updates);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to sync checklist to Supabase:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat sync ceklis' };
  }
};

export const fetchSingleRestockFromSupabase = async (restockId: string): Promise<RestockList | null> => {
  try {
    const { data: header, error: hError } = await supabase
      .from('restock')
      .select('*')
      .eq('restock_id', restockId)
      .maybeSingle();

    if (hError || !header) return null;

    const { data: items, error: iError } = await supabase
      .from('restock_item')
      .select('restock_id, color_id, demand, ischecked, product_code')
      .eq('restock_id', restockId);

    if (iError) throw iError;

    const { data: products } = await supabase
      .from('product')
      .select('product_code, nama, product_color(color_id, color:color_id(color))');

    const categoriesMap = new Map<string, any>();
    (items || []).forEach(item => {
      if (!categoriesMap.has(item.product_code)) {
        const prodInfo = products?.find(p => p.product_code === item.product_code);
        categoriesMap.set(item.product_code, {
          id: item.product_code,
          name: prodInfo ? prodInfo.nama : 'Unknown Product',
          skus: [],
          variants: []
        });
      }

      const cat = categoriesMap.get(item.product_code);
      const prodInfo = products?.find(p => p.product_code === item.product_code);
      const colorInfo = prodInfo?.product_color?.find((pc: any) => pc.color_id === item.color_id);
      const colorName = (colorInfo?.color as any)?.color || (colorInfo?.color as any)?.[0]?.color || 'Unknown Color';

      cat.variants.push({
        id: `${item.product_code}_${item.color_id}`,
        name: colorName,
        stock: 0,
        targetQuantity: item.demand,
        checked: item.ischecked
      });
    });

    const list: RestockList = {
      id: header.restock_id,
      userId: header.user_id,
      title: header.title || `Restock ${header.tanggal}`,
      categories: Array.from(categoriesMap.values()),
      importedFiles: [],
      importHistory: [],
      status: 'finalized',
      createdAt: new Date(header.created_at),
      updatedAt: new Date(header.updated_at || header.created_at)
    };

    return list;
  } catch (err) {
    console.error('Failed to fetch single restock from Supabase:', err);
    return null;
  }
};

export const pullRestockFromSupabase = async (userId?: string) => {
  try {
    // 1. Ambil data restock headers
    let query = supabase.from('restock').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data: headers, error: headersError } = await query;
    if (headersError) throw headersError;
    if (!headers || headers.length === 0) return { success: true, count: 0 };

    // 2. Ambil restock items beserta referensi produk
    const { data: items, error: itemsError } = await supabase.from('restock_item').select(`
      restock_id, color_id, demand, ischecked, product_code
    `);
    if (itemsError) throw itemsError;

    // Ambil data nama barang dan warna dari Supabase untuk rekonstitusi nama di Dexie
    const { data: products } = await supabase.from('product').select('product_code, nama, product_color(color_id, color:color_id(color))');

    // 3. Rekonstruksi format Dexie JSON
    const localLists: RestockList[] = [];

    for (const header of headers) {
      const headerItems = items?.filter(i => i.restock_id === header.restock_id) || [];
      
      // Kelompokkan item berdasarkan product_code
      const categoriesMap = new Map<string, any>();
      
      headerItems.forEach(item => {
        if (!categoriesMap.has(item.product_code)) {
          // Cari nama produk
          const prodInfo = products?.find(p => p.product_code === item.product_code);
          categoriesMap.set(item.product_code, {
            id: item.product_code,
            name: prodInfo ? prodInfo.nama : 'Unknown Product',
            skus: [],
            variants: []
          });
        }
        
        const cat = categoriesMap.get(item.product_code);
        
        // Cari nama warna
        const prodInfo = products?.find(p => p.product_code === item.product_code);
        const colorInfo = prodInfo?.product_color?.find((pc: any) => pc.color_id === item.color_id);
        const colorName = (colorInfo?.color as any)?.color || (colorInfo?.color as any)?.[0]?.color || 'Unknown Color';

        cat.variants.push({
          id: `${item.product_code}_${item.color_id}`,
          name: colorName,
          stock: 0,
          targetQuantity: item.demand,
          checked: item.ischecked
        });
      });

      const list: RestockList = {
        id: header.restock_id,
        userId: header.user_id,
        title: header.title || `Restock ${header.tanggal}`,
        categories: Array.from(categoriesMap.values()),
        importedFiles: [],
        importHistory: [],
        status: 'finalized',
        createdAt: new Date(header.created_at),
        updatedAt: new Date(header.updated_at || header.created_at)
      };

      localLists.push(list);
    }

    // 4. Simpan ke lokal secara bulk
    await db.transaction('rw', db.restockLists, async () => {
      if (userId) {
        const allExisting = await db.restockLists.toArray();
        const toDelete = allExisting
          .filter(l => l.userId === userId || (!l.userId && localLists.some(nl => nl.id === l.id)))
          .map(l => l.id);
        if (toDelete.length > 0) {
          await db.restockLists.bulkDelete(toDelete);
        }
      } else {
        await db.restockLists.clear();
      }
      if (localLists.length > 0) {
        await db.restockLists.bulkPut(localLists);
      }
    });

    return { success: true, count: localLists.length };
  } catch (error: any) {
    console.error('Pull Restock Error:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat tarik data' };
  }
};
