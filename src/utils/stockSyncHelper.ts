import { db } from '../db/database';
import { supabase } from '../db/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import type { StockSyncItem } from '../components/ui/StockSyncModal';

export const applyStockSync = async (
  items: StockSyncItem[],
  source: 'online' | 'offline',
  action: 'deduct' | 'restore'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    if (source === 'offline') {
      const barangs = await db.barang.toArray();
      const subBarangs = await db.subBarang.toArray();

      for (const item of items) {
        if (!item.quantity) continue;
        const diff = action === 'deduct' ? -item.quantity : item.quantity;

        let targetSub = subBarangs.find((s) => s.id === item.variantId);

        if (!targetSub) {
          const nProd = normalize(item.productName);
          const matchedBarang = barangs.find((b) => {
            const nb = normalize(b.name);
            return nb === nProd || nProd.includes(nb) || nb.includes(nProd);
          });

          if (matchedBarang) {
            const nVar = normalize(item.variantName === 'Tanpa Variasi' ? '' : item.variantName);
            targetSub = subBarangs.find((s) => {
              if (s.barangId !== matchedBarang.id) return false;
              if (!nVar && subBarangs.filter((sb) => sb.barangId === matchedBarang.id).length === 1) return true;
              return normalize(s.name) === nVar;
            });
          }
        }

        if (targetSub) {
          const newStock = (targetSub.stock || 0) + diff;
          await db.subBarang.update(targetSub.id, { stock: newStock });
          targetSub.stock = newStock;
        }
      }
      return { success: true };
    } else {
      // Online mode (Supabase)
      const user = useAuthStore.getState().user;
      let query = supabase
        .from('product')
        .select(`
          product_code,
          nama,
          product_color (
            product_id,
            color_id,
            stok,
            color:color_id (color)
          ),
          sku (
            id_sku
          )
        `);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data: products, error } = await query;
      if (error || !products) {
        throw new Error(error?.message || 'Gagal mengambil data katalog dari server');
      }

      for (const item of items) {
        if (!item.quantity) continue;
        const diff = action === 'deduct' ? -item.quantity : item.quantity;

        let targetProductId = '';
        let targetColorId = '';
        let currentStok = 0;

        if (item.variantId && item.variantId.includes('_')) {
          const parts = item.variantId.split('_');
          targetProductId = parts[0];
          targetColorId = parts.slice(1).join('_');

          const prod = products.find((p: any) => p.product_code === targetProductId);
          const pc = prod?.product_color?.find((c: any) => c.color_id === targetColorId);
          if (pc) {
            currentStok = pc.stok || 0;
          }
        }

        if (!targetProductId || !targetColorId) {
          const nProd = normalize(item.productName);
          const matchedProd = products.find((p: any) => {
            const np = normalize(p.nama);
            return np === nProd || nProd.includes(np) || np.includes(nProd);
          });

          if (matchedProd && matchedProd.product_color) {
            const nVar = normalize(item.variantName === 'Tanpa Variasi' ? '' : item.variantName);
            const matchedPc = matchedProd.product_color.find((pc: any) => {
              if (!nVar && matchedProd.product_color.length === 1) return true;
              return normalize(pc.color?.color || '') === nVar;
            });

            if (matchedPc) {
              targetProductId = matchedPc.product_id;
              targetColorId = matchedPc.color_id;
              currentStok = matchedPc.stok || 0;
            }
          }
        }

        if (targetProductId && targetColorId) {
          const newStok = currentStok + diff;
          const { error: updateErr } = await supabase
            .from('product_color')
            .update({ stok: newStok })
            .match({ product_id: targetProductId, color_id: targetColorId });

          if (updateErr) {
            console.error('Failed to update product_color in Supabase:', updateErr);
          } else {
            try {
              if (db.product_color) {
                await db.product_color.where({ product_id: targetProductId, color_id: targetColorId }).modify({ stok: newStok });
              }
            } catch (e) {
              console.warn('Dexie mirror update warning:', e);
            }
          }
        }
      }
      return { success: true };
    }
  } catch (err: any) {
    console.error('applyStockSync error:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan saat memperbarui stok master' };
  }
};
