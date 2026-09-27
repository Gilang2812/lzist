import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { supabase } from '../db/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppModeStore } from '../stores/useAppModeStore';
import Modal from '../components/ui/Modal';
import type { SubBarang } from '../types';
import { generateId } from '../utils/generateId';
import Toast from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ROUTES } from '../routes';

const TambahKatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuthStore();
  const { mode } = useAppModeStore();

  const [formName, setFormName] = useState('');
  const [formSkus, setFormSkus] = useState<string[]>(['']);
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<SubBarang[]>([]);
  const [massStock, setMassStock] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [addingImageVariantIdx, setAddingImageVariantIdx] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const suppliers = useLiveQuery(() => db.suppliers.orderBy('name').toArray());

  const toggleSupplier = (supId: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(supId) ? prev.filter(s => s !== supId) : [...prev, supId]
    );
  };

  const handleVariantChange = (index: number, field: keyof SubBarang, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: generateId('sub'),
        barangId: '', // Will be assigned on save
        name: '',
        stock: 0,
        images: []
      }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const handleSkuChange = (index: number, value: string) => {
    const newSkus = [...formSkus];
    newSkus[index] = value;
    if (index === newSkus.length - 1 && value !== '') {
      newSkus.push('');
    }
    setFormSkus(newSkus);
  };

  const removeSku = (index: number) => {
    const newSkus = formSkus.filter((_, i) => i !== index);
    if (newSkus.length === 0) newSkus.push('');
    setFormSkus(newSkus);
  };

  const openImagePreview = (url: string) => setViewingImage(url);

  const openAddImageModal = (variantIndex: number) => {
    setAddingImageVariantIdx(variantIndex);
    setNewImageUrl('');
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (addingImageVariantIdx === null || !newImageUrl.trim()) return;

    const newVariants = [...variants];
    const variant = newVariants[addingImageVariantIdx];
    variant.images = [...(variant.images || []), newImageUrl.trim()];
    setVariants(newVariants);
    setAddingImageVariantIdx(null);
    setNewImageUrl('');
  };

  const handleRemoveImage = (variantIndex: number, imgIndex: number) => {
    const newVariants = [...variants];
    const variant = newVariants[variantIndex];
    if (variant.images) {
      variant.images.splice(imgIndex, 1);
    }
    setVariants(newVariants);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'online') {
        if (!user) {
          showToast('Anda harus login untuk menyimpan ke server', 'error');
          setIsSubmitting(false);
          return;
        }

        const newProductId = 'PRD-' + Date.now();
        const priceNum = formPrice === '' ? 0 : Number(formPrice);

        // 1. Insert product
        const { error: prodError } = await supabase.from('product').insert([
          {
            product_code: newProductId,
            user_id: user.id,
            nama: formName.trim(),
            price: priceNum,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);

        if (prodError) throw prodError;

        // 2. Insert SKUs
        const activeSkus = formSkus.map(s => s.trim()).filter(Boolean);
        if (activeSkus.length > 0) {
          const skuPayloads = activeSkus.map(s => ({
            id_sku: s,
            product_code: newProductId,
            name: formName.trim(),
          }));
          const { error: skuError } = await supabase.from('sku').insert(skuPayloads);
          if (skuError) console.error('Failed to insert skus:', skuError);
        }

        // 3. Fetch current colors to avoid duplicate names
        const { data: existingColors } = await supabase.from('color').select('*');
        const colorList = existingColors || [];

        // 4. Insert variants & images
        for (const variant of variants) {
          const colorName = variant.name?.trim() || 'Default';
          let finalColorId = '';

          const matchedColor = colorList.find(
            (c: any) => c.color?.toLowerCase() === colorName.toLowerCase()
          );

          if (matchedColor) {
            finalColorId = matchedColor.color_id;
          } else {
            const newColorId = `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const { error: insertColorError } = await supabase.from('color').insert([
              {
                color_id: newColorId,
                color: colorName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false,
              },
            ]);

            if (insertColorError) {
              console.error('Failed to insert color:', insertColorError);
            } else {
              finalColorId = newColorId;
              colorList.push({ color_id: newColorId, color: colorName });
            }
          }

          if (finalColorId) {
            // Insert product_color
            const { error: pcError } = await supabase.from('product_color').insert([
              {
                product_id: newProductId,
                color_id: finalColorId,
                stok: Number(variant.stock) || 0,
                harga: priceNum,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);
            if (pcError) console.error('Failed to insert product_color:', pcError);

            // Insert images if any
            if (variant.images && variant.images.length > 0) {
              const imgPayloads = variant.images.map(imgUrl => ({
                color_img_id: `cimg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                product_id: newProductId,
                color_id: finalColorId,
                image_path: imgUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
              const { error: imgError } = await supabase.from('color_img').insert(imgPayloads);
              if (imgError) console.error('Failed to insert color_img:', imgError);
            }
          }
        }

        showToast('Barang berhasil disimpan ke server!', 'success');
        navigate(ROUTES.KATALOG.INDEX);
      } else {
        // Offline Dexie Save
        const newBarangId = generateId('brg');

        await db.transaction('rw', db.barang, db.barangSupplier, db.subBarang, async () => {
          await db.barang.add({
            id: newBarangId,
            name: formName,
            skus: formSkus.map(s => s.trim()).filter(s => s),
            price: formPrice === '' ? undefined : Number(formPrice),
            supplierIds: selectedSupplierIds,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // update links
          for (const supplierId of selectedSupplierIds) {
            await db.barangSupplier.add({ id: `${newBarangId}-${supplierId}`, barangId: newBarangId, supplierId });
          }

          // add variants
          for (const variant of variants) {
            await db.subBarang.add({
              id: variant.id,
              barangId: newBarangId,
              name: variant.name,
              stock: variant.stock,
              images: variant.images
            });
          }
        });
        showToast('Barang berhasil disimpan!', 'success');
        navigate(ROUTES.KATALOG.INDEX);
      }
    } catch (error) {
      console.error('Failed to save changes', error);
      showToast('Gagal menyimpan barang baru', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => navigate(ROUTES.KATALOG.INDEX)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-h1 text-h1 text-on-surface">Tambah Barang</h1>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${mode === 'online'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-500/20'
                  : 'bg-surface-container text-on-surface-variant border border-surface-variant'
                }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {mode === 'online' ? 'cloud' : 'cloud_off'}
                </span>
                {mode === 'online' ? 'Mode Online (Server)' : 'Mode Offline (Lokal)'}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Tambahkan informasi barang dan varian baru</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-xl">
          <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-variant flex flex-col gap-md">
            <h2 className="font-h3 text-h3 text-on-surface">Informasi Utama</h2>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface">Nama Barang <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-md">
              <div className="flex flex-col gap-xs flex-1">
                <label className="font-label-md text-on-surface">SKU Induk</label>
                <div className="flex flex-col gap-sm">
                  {formSkus.map((sku, idx) => (
                    <div key={idx} className="flex items-center gap-xs">
                      <input
                        type="text"
                        value={sku}
                        onChange={e => handleSkuChange(idx, e.target.value)}
                        className="bg-surface-container flex-1 px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Masukkan SKU"
                      />
                      {idx < formSkus.length - 1 && (
                        <button
                          type="button"
                          onClick={() => removeSku(idx)}
                          className="p-2 text-on-surface-variant hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-xs flex-1">
                <label className="font-label-md text-on-surface">Harga (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value ? Number(e.target.value) : '')}
                  className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Contoh: 150000"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface">Supplier</label>
              {!suppliers || suppliers.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant bg-surface-container px-md py-sm rounded-lg">
                  Belum ada supplier.{' '}
                  <span
                    className="text-primary underline cursor-pointer"
                    onClick={() => navigate(ROUTES.SUPPLIER.INDEX)}
                  >
                    Tambah supplier
                  </span>{' '}
                  terlebih dahulu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-xs">
                  {suppliers.map(sup => {
                    const active = selectedSupplierIds.includes(sup.id);
                    return (
                      <button
                        key={sup.id}
                        type="button"
                        onClick={() => toggleSupplier(sup.id)}
                        className={`px-sm py-1 rounded-full text-label-sm font-label-sm border transition-colors cursor-pointer ${active
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container text-on-surface-variant border-surface-variant hover:border-primary'
                          }`}
                      >
                        {active && <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">check</span>}
                        {sup.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-variant flex flex-col gap-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="flex items-center gap-sm">
                <h2 className="font-h3 text-h3 text-on-surface">Daftar Varian</h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-sm py-1 bg-surface-container hover:bg-surface-variant text-on-surface text-label-md rounded-md border border-surface-variant transition-colors flex items-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tambah Varian
                </button>
              </div>
              {variants.length > 0 && (
                <div className="flex items-center gap-sm">
                  <label className="text-label-md text-on-surface-variant whitespace-nowrap">Update Stok Massal:</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={massStock}
                      onChange={(e) => setMassStock(e.target.value ? Number(e.target.value) : '')}
                      className="w-20 bg-surface-container px-sm py-1.5 rounded-l-md text-on-surface outline-none focus:ring-2 focus:ring-primary text-body-md border border-surface-variant border-r-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (massStock !== '') {
                          setVariants(variants.map(v => ({ ...v, stock: Number(massStock) })));
                          setMassStock('');
                        }
                      }}
                      className="bg-primary hover:bg-primary/90 text-on-primary px-sm py-1.5 rounded-r-md text-label-md font-label-md transition-colors border border-primary cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}
            </div>
            {variants.length === 0 ? (
              <p className="text-on-surface-variant bg-surface-container px-md py-sm rounded-lg">
                Belum ada varian untuk barang ini.
              </p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-surface-variant text-on-surface-variant">
                      <th className="pb-sm font-label-md">Nama Varian</th>
                      <th className="pb-sm font-label-md w-32">Stok</th>
                      <th className="pb-sm font-label-md">URL Gambar</th>
                      <th className="pb-sm font-label-md w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={v.id} className="border-b border-surface-variant/50 last:border-0">
                        <td className="py-sm pr-sm">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                            className="w-full bg-surface-container px-sm py-1.5 rounded-md text-on-surface outline-none focus:ring-2 focus:ring-primary text-body-md"
                          />
                        </td>
                        <td className="py-sm pr-sm">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, 'stock', Number(e.target.value))}
                            className="w-full bg-surface-container px-sm py-1.5 rounded-md text-on-surface outline-none focus:ring-2 focus:ring-primary text-body-md"
                          />
                        </td>
                        <td className="py-sm">
                          <div className="flex flex-wrap gap-2 items-center">
                            {v.images?.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative group">
                                <img
                                  src={img}
                                  alt="Variant"
                                  className="w-12 h-12 object-cover rounded cursor-pointer border border-surface-variant hover:opacity-80 transition-opacity"
                                  onClick={() => openImagePreview(img)}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx, imgIdx)}
                                  className="absolute -top-2 -right-2 bg-error text-on-error rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Hapus gambar"
                                >
                                  <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => openAddImageModal(idx)}
                              className="w-12 h-12 rounded border-2 border-dashed border-surface-variant text-on-surface-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors cursor-pointer"
                              title="Tambah Gambar"
                            >
                              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-sm pl-sm text-right align-top">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-md hover:bg-error/10 cursor-pointer"
                            title="Hapus Varian"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-sm">
            <button
              type="button"
              onClick={() => navigate(ROUTES.KATALOG.INDEX)}
              className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer"
            >
              Simpan Barang
            </button>
          </div>
        </form>

        {/* Image Preview Modal */}
        <Modal isOpen={!!viewingImage} onClose={() => setViewingImage(null)} title="Lihat Gambar">
          <div className="p-md flex justify-center">
            {viewingImage && (
              <img src={viewingImage} alt="Preview Besar" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            )}
          </div>
        </Modal>

        {/* Add Image Modal */}
        <Modal isOpen={addingImageVariantIdx !== null} onClose={() => setAddingImageVariantIdx(null)} title="Tambah Gambar Varian">
          <form onSubmit={handleAddImage} className="p-md flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface">URL Gambar Baru <span className="text-error">*</span></label>
              <input
                type="url"
                required
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button type="button" onClick={() => setAddingImageVariantIdx(null)} className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer">
                Batal
              </button>
              <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer">
                Tambah
              </button>
            </div>
          </form>
        </Modal>
        <LoadingSpinner isOpen={isSubmitting} title="Menyimpan barang..." />
      </main>
    </>
  );
};

export default TambahKatalogPage;
