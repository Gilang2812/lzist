import { db } from '../db/database';
import type { Category, Variant } from '../types';

export const fetchCatalogAsCategories = async (): Promise<Category[]> => {
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
      variants,
      supplierNames,
    };
  });

  return categories;
};
