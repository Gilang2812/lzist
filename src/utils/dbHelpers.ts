import { db } from '../db/database';
import { supabase } from '../db/supabase';
import { useAppModeStore } from '../stores/useAppModeStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { Category, Variant } from '../types';

export const fetchOfflineCatalogAsCategories = async (): Promise<Category[]> => {
  const barangs = await db.barang.toArray();
  const subBarangs = await db.subBarang.toArray();
  const allLinks = await db.barangSupplier.toArray();
  const allSuppliers = await db.suppliers.toArray();

  const categories: Category[] = barangs.map(barang => {
    const variants: Variant[] = subBarangs
      .filter(sub => sub.barangId === barang.id)
      .map(sub => ({
        id: sub.id,
        name: sub.name,
        stock: sub.stock,
        targetQuantity: 0,
        images: sub.images,
      }));

    const links = allLinks.filter(l => l.barangId === barang.id);
    const supplierNames = links
      .map(l => allSuppliers.find(s => s.id === l.supplierId)?.name)
      .filter((n): n is string => !!n);

    return {
      id: barang.id,
      name: barang.name,
      skus: barang.skus,
      variants,
      supplierNames,
      price: barang.price,
    };
  });

  return categories;
};

export const fetchOnlineCatalogAsCategories = async (): Promise<Category[]> => {
  const user = useAuthStore.getState().user;
  let query = supabase
    .from('product')
    .select(`
      product_code,
      nama,
      price,
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
    console.error('Failed to fetch catalog from Supabase:', error);
    return [];
  }

  const categories: Category[] = products.map((prod: any) => {
    const variants: Variant[] = (prod.product_color || []).map((pc: any) => ({
      id: pc.product_id + '_' + pc.color_id,
      name: pc.color?.color || 'Unknown',
      stock: pc.stok || 0,
      targetQuantity: 0,
      images: [],
    }));

    const skus = (prod.sku || []).map((s: any) => s.id_sku);

    return {
      id: prod.product_code,
      name: prod.nama || 'Unnamed',
      skus,
      variants,
      supplierNames: [],
      price: prod.price || 0,
    };
  });

  return categories;
};

export const fetchCatalogAsCategories = async (): Promise<Category[]> => {
  const mode = useAppModeStore.getState().mode;
  if (mode === 'offline') {
    return fetchOfflineCatalogAsCategories();
  }
  return fetchOnlineCatalogAsCategories();
};
