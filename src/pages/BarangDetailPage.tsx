import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { SubBarang } from '../types';

const BarangDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  // CRUD Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editVariant, setEditVariant] = useState<SubBarang | null>(null);
  const [deleteVariant, setDeleteVariant] = useState<SubBarang | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', stock: 0, image: '' });

  const data = useLiveQuery(async () => {
    if (!id) return null;
    const barang = await db.barang.get(id);
    if (!barang) return null;

    const subBarangs = await db.subBarang.where('barangId').equals(id).toArray();

    // fetch linked suppliers
    const links = await db.barangSupplier.where('barangId').equals(id).toArray();
    const supplierNames: string[] = [];
    for (const link of links) {
      const sup = await db.suppliers.get(link.supplierId);
      if (sup) supplierNames.push(sup.name);
    }

    return { barang, subBarangs, supplierNames };
  }, [id]);

  if (data === undefined) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <p className="text-on-surface-variant text-center py-xl">Memuat data...</p>
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline w-fit cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <EmptyState
          icon="inventory_2"
          title="Barang Tidak Ditemukan"
          description="Barang yang Anda cari tidak ada atau telah dihapus."
        />
      </main>
    );
  }

  const { barang, subBarangs, supplierNames } = data;
  const totalStock = subBarangs.reduce((sum, v) => sum + (v.stock || 0), 0);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !id) return;

    try {
      await db.subBarang.add({
        id: Date.now().toString(),
        barangId: id,
        name: formData.name,
        stock: Number(formData.stock),
        images: formData.image ? [formData.image] : [],
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', stock: 0, image: '' });
    } catch (error) {
      console.error('Failed to add variant', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVariant || !formData.name.trim()) return;

    try {
      await db.subBarang.update(editVariant.id, {
        name: formData.name,
        stock: Number(formData.stock),
        images: formData.image ? [formData.image] : [],
      });
      setEditVariant(null);
      setFormData({ name: '', stock: 0, image: '' });
    } catch (error) {
      console.error('Failed to update variant', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteVariant) return;
    try {
      await db.subBarang.delete(deleteVariant.id);
      setDeleteVariant(null);
    } catch (error) {
      console.error('Failed to delete variant', error);
    }
  };

  const openEditModal = (e: React.MouseEvent, item: SubBarang) => {
    e.stopPropagation();
    setEditVariant(item);
    setFormData({
      name: item.name,
      stock: item.stock || 0,
      image: item.images && item.images.length > 0 ? item.images[0] : '',
    });
  };

  const openDeleteModal = (e: React.MouseEvent, item: SubBarang) => {
    e.stopPropagation();
    setDeleteVariant(item);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex flex-col gap-md">
        <button onClick={() => navigate(-1)} className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline w-fit cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Katalog
        </button>
        <div className="flex items-start justify-between gap-md">
          <div className="flex-1 min-w-0">
            <h1 className="font-h1 text-h1 text-on-surface">{barang.name}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Total Stok: <strong className="text-on-surface">{totalStock}</strong> • {subBarangs.length} Varian
            </p>
            {supplierNames.length > 0 && (
              <div className="flex flex-wrap gap-xs mt-sm">
                {supplierNames.map(name => (
                  <span
                    key={name}
                    className="flex items-center gap-1 bg-secondary-container text-on-secondary-container text-label-sm font-label-sm px-sm py-0.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', stock: 0, image: '' });
              setIsAddModalOpen(true);
            }}
            className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Varian
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-h2 text-h2 text-on-surface border-b border-surface-variant pb-xs">Daftar Varian</h2>

        {subBarangs.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="Belum ada varian"
            description="Barang ini belum memiliki varian. Silakan tambah varian baru."
          />
        ) : (
          <div className="flex flex-col gap-sm">
            {subBarangs.map(variant => (
              <div key={variant.id} className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm flex items-center gap-sm hover:bg-surface-container-low transition-colors">
                {variant.images && variant.images.length > 0 ? (
                  <img
                    src={variant.images[0]}
                    alt={variant.name}
                    className="w-12 h-12 object-cover rounded bg-surface-container flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage({ url: variant.images![0], alt: variant.name })}
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-surface-container rounded text-on-surface-variant flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">image</span>
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-label-lg text-label-lg text-on-surface truncate">{variant.name}</h3>
                    {variant.stock === 0 && (
                      <span className="bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap flex-shrink-0">Habis</span>
                    )}
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant flex-wrap mt-0.5">
                    <span>Stok: <strong className={variant.stock === 0 ? 'text-error' : 'text-on-surface'}>{variant.stock}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => openEditModal(e, variant)}
                    className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors cursor-pointer"
                    title="Edit Varian"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(e, variant)}
                    className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error-container transition-colors cursor-pointer"
                    title="Hapus Varian"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title={selectedImage?.alt}>
        {selectedImage && (
          <div className="p-4 flex items-center justify-center bg-surface-container-lowest">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
            />
          </div>
        )}
      </Modal>

      {/* Add Variant Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Varian">
        <form onSubmit={handleAddSubmit} className="p-md flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">Nama Varian <span className="text-error">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contoh: Merah Mocca"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">Stok</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">URL Gambar</label>
            <input
              type="text"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
              placeholder="/assets/images/xyz.jpg"
            />
          </div>
          <div className="flex justify-end gap-sm mt-sm">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer">
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Variant Modal */}
      <Modal isOpen={!!editVariant} onClose={() => setEditVariant(null)} title="Edit Varian">
        <form onSubmit={handleEditSubmit} className="p-md flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">Nama Varian <span className="text-error">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">Stok</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">URL Gambar</label>
            <input
              type="text"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-sm mt-sm">
            <button type="button" onClick={() => setEditVariant(null)} className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteVariant}
        title="Hapus Varian"
        message={`Apakah Anda yakin ingin menghapus varian "${deleteVariant?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteVariant(null)}
        variant="danger"
      />
    </main>
  );
};

export default BarangDetailPage;
