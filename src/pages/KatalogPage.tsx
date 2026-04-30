import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Barang } from '../types';

const KatalogPage: React.FC = () => {
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Barang | null>(null);
  const [deleteItem, setDeleteItem] = useState<Barang | null>(null);

  const [formName, setFormName] = useState('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  const suppliers = useLiveQuery(() => db.suppliers.orderBy('name').toArray());

  const barangs = useLiveQuery(async () => {
    const all = await db.barang.orderBy('name').toArray();

    const enriched = await Promise.all(all.map(async (b) => {
      const subBarangs = await db.subBarang.where('barangId').equals(b.id).toArray();
      const totalStock = subBarangs.reduce((sum, v) => sum + (v.stock || 0), 0);
      let imageUrl = '';
      for (const variant of subBarangs) {
        if (variant.images && variant.images.length > 0) {
          imageUrl = variant.images[0];
          break;
        }
      }
      // fetch linked supplier names
      const links = await db.barangSupplier.where('barangId').equals(b.id).toArray();
      const supplierNames: string[] = [];
      for (const link of links) {
        const sup = await db.suppliers.get(link.supplierId);
        if (sup) supplierNames.push(sup.name);
      }

      return { ...b, variantCount: subBarangs.length, totalStock, imageUrl, supplierNames };
    }));

    return enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  const resetForm = () => {
    setFormName('');
    setSelectedSupplierIds([]);
  };

  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const barangId = Date.now().toString();
      await db.barang.add({
        id: barangId,
        name: formName,
        supplierIds: selectedSupplierIds,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // insert junction rows
      for (const supplierId of selectedSupplierIds) {
        await db.barangSupplier.add({ id: `${barangId}-${supplierId}`, barangId, supplierId });
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add barang', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formName.trim()) return;

    try {
      await db.transaction('rw', db.barang, db.barangSupplier, async () => {
        await db.barang.update(editItem.id, {
          name: formName,
          supplierIds: selectedSupplierIds,
          updatedAt: new Date()
        });
        // remove old links and re-insert
        await db.barangSupplier.where('barangId').equals(editItem.id).delete();
        for (const supplierId of selectedSupplierIds) {
          await db.barangSupplier.add({ id: `${editItem.id}-${supplierId}`, barangId: editItem.id, supplierId });
        }
      });
      setEditItem(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update barang', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await db.transaction('rw', db.barang, db.subBarang, db.barangSupplier, async () => {
        await db.subBarang.where('barangId').equals(deleteItem.id).delete();
        await db.barangSupplier.where('barangId').equals(deleteItem.id).delete();
        await db.barang.delete(deleteItem.id);
      });
      setDeleteItem(null);
    } catch (error) {
      console.error('Failed to delete barang', error);
    }
  };

  const openEditModal = (e: React.MouseEvent, item: Barang) => {
    e.stopPropagation();
    setEditItem(item);
    setFormName(item.name);
    setSelectedSupplierIds(item.supplierIds || []);
  };

  const openDeleteModal = (e: React.MouseEvent, item: Barang) => {
    e.stopPropagation();
    setDeleteItem(item);
  };

  const SupplierPicker: React.FC = () => (
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
  );

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Katalog Barang</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola semua barang dan varian.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah
        </button>
      </div>

      {!barangs ? (
        <div className="flex justify-center py-xl">
          <p className="text-on-surface-variant">Memuat data...</p>
        </div>
      ) : barangs.length === 0 ? (
        <EmptyState
          icon="menu_book"
          title="Katalog masih kosong"
          description="Tambahkan barang pertama untuk memulai mengelola inventaris."
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {barangs.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/katalog/${item.id}`)}
              className="bg-surface-container-lowest rounded-xl border border-surface-variant border-l-4 border-l-primary-fixed-dim p-md cursor-pointer hover:shadow-md hover:border-l-primary transition-all flex gap-md items-center"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg bg-surface-container flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 flex items-center justify-center bg-surface-container rounded-lg text-on-surface-variant flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-h3 text-h3 text-on-surface truncate" title={item.name}>{item.name}</h3>
                <div className="flex items-center gap-xs mt-xs flex-wrap">
                  <span className="text-[11px] font-medium text-on-surface-variant bg-surface-variant/40 px-xs py-0.5 rounded">
                    {item.variantCount} Varian
                  </span>
                  <span className="text-[11px] text-on-surface-variant">·</span>
                  <span className="text-[11px] text-on-surface-variant">
                    Stok <strong className={item.totalStock === 0 ? 'text-error' : 'text-on-surface'}>{item.totalStock}</strong>
                  </span>
                  {item.supplierNames.length > 0 && (
                    <>
                      <span className="text-[11px] text-on-surface-variant">·</span>
                      {item.supplierNames.map(s => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-0.5 text-[11px] text-on-secondary-container bg-secondary-container px-xs py-0.5 rounded-full leading-none"
                        >
                          <span className="material-symbols-outlined text-[11px]">local_shipping</span>
                          {s}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => openEditModal(e, item as Barang)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={(e) => openDeleteModal(e, item as Barang)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
                  title="Hapus"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Barang">
        <form onSubmit={handleAddSubmit} className="p-md flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">Nama Barang <span className="text-error">*</span></label>
            <input
              type="text"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contoh: Pashmina Tencel"
            />
          </div>
          <SupplierPicker />
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

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => { setEditItem(null); resetForm(); }} title="Edit Barang">
        <form onSubmit={handleEditSubmit} className="p-md flex flex-col gap-md">
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
          <SupplierPicker />
          <div className="flex justify-end gap-sm mt-sm">
            <button type="button" onClick={() => { setEditItem(null); resetForm(); }} className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Hapus Barang"
        message={`Apakah Anda yakin ingin menghapus barang "${deleteItem?.name}" beserta semua variannya? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        variant="danger"
      />
    </main>
  );
};

export default KatalogPage;
