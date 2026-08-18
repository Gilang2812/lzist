import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import Modal from '../components/ui/Modal';
import type { SubBarang } from '../types';

const EditKatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formName, setFormName] = useState('');
  const [formSkus, setFormSkus] = useState<string[]>(['']);
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<SubBarang[]>([]);
  const [massStock, setMassStock] = useState<number | ''>('');
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [addingImageVariantIdx, setAddingImageVariantIdx] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  const suppliers = useLiveQuery(() => db.suppliers.orderBy('name').toArray());

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const b = await db.barang.get(id);
      if (b) {
        setFormName(b.name);
        const initialSkus = b.skus && b.skus.length > 0 ? [...b.skus, ''] : [''];
        setFormSkus(initialSkus);
        setFormPrice(b.price || '');
        setSelectedSupplierIds(b.supplierIds || []);
      }
      const subBarangs = await db.subBarang.where('barangId').equals(id).toArray();
      setVariants(subBarangs);
    };
    loadData();
  }, [id]);

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
    if (!id || !formName.trim()) return;

    try {
      await db.transaction('rw', db.barang, db.barangSupplier, db.subBarang, async () => {
        await db.barang.update(id, {
          name: formName,
          skus: formSkus.map(s => s.trim()).filter(s => s),
          price: formPrice === '' ? undefined : Number(formPrice),
          supplierIds: selectedSupplierIds,
          updatedAt: new Date()
        });

        // update links
        await db.barangSupplier.where('barangId').equals(id).delete();
        for (const supplierId of selectedSupplierIds) {
          await db.barangSupplier.add({ id: `${id}-${supplierId}`, barangId: id, supplierId });
        }

        // update variants
        for (const variant of variants) {
          await db.subBarang.update(variant.id, {
            name: variant.name,
            stock: variant.stock,
            images: variant.images
          });
        }
      });
      navigate('/katalog');
    } catch (error) {
      console.error('Failed to save changes', error);
      alert('Gagal menyimpan perubahan');
    }
  };

  return (
    <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex items-center gap-sm">
        <button
          onClick={() => navigate('/katalog')}
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-h1 text-h1 text-on-surface">Edit Barang</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Ubah informasi barang dan varian</p>
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
                  onClick={() => navigate('/supplier')}
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
                      className={`px-sm py-1 rounded-full text-label-sm font-label-sm border transition-colors cursor-pointer ${
                        active
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
            <h2 className="font-h3 text-h3 text-on-surface">Daftar Varian</h2>
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
            onClick={() => navigate('/katalog')}
            className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer"
          >
            Simpan Perubahan
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
    </main>
  );
};

export default EditKatalogPage;
