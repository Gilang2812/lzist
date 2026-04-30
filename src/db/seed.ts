import { db } from './database';
import type { Barang, Supplier, BarangSupplier } from '../types';
import { generateId } from '../utils/generateId';

/**
 * Seed demo data into the database.
 * Only runs if no data exists yet.
 */
export async function seedDatabase(): Promise<void> {
  const count = await db.barang.count();
  if (count > 0) return; // Already seeded

  const supplierId = generateId('sup');
  const supplier: Supplier = {
    id: supplierId,
    name: 'Supplier Tekstil Jaya',
    contact: 'Pak Ahmad',
    phone: '081234567890',
    address: 'Jl. Tekstil No. 42, Bandung',
    createdAt: new Date(),
  };

  const barangId = generateId('brg');
  const barang: Barang = {
    id: barangId,
    name: 'Kain Jilbab',
    supplierIds: [supplierId],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const junction: BarangSupplier = {
    id: `${barangId}-${supplierId}`,
    barangId,
    supplierId,
  };

  await db.suppliers.add(supplier);
  await db.barang.add(barang);
  await db.barangSupplier.add(junction);

  // add sub-barang separately
  const subItems = [
    { id: generateId('sb'), barangId, name: 'Jilbab Merah', stock: 2, images: [] },
    { id: generateId('sb'), barangId, name: 'Jilbab Biru', stock: 5, images: [] },
    { id: generateId('sb'), barangId, name: 'Jilbab Hitam', stock: 0, images: [] },
  ];
  for (const item of subItems) {
    await db.subBarang.add(item);
  }
}
