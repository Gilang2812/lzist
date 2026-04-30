import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Supplier } from '../types';

interface SupplierFormData {
  name: string;
  contact: string;
  phone: string;
  address: string;
  notes: string;
}

const emptyForm: SupplierFormData = { name: '', contact: '', phone: '', address: '', notes: '' };

const SupplierListPage: React.FC = () => {
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteItem, setDeleteItem] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyForm);

  const suppliers = useLiveQuery(async () => {
    const all = await db.suppliers.orderBy('name').toArray();
    // count linked barang for each supplier
    const enriched = await Promise.all(all.map(async (sup) => {
      const links = await db.barangSupplier.where('supplierId').equals(sup.id).toArray();
      return { ...sup, barangCount: links.length };
    }));
    return enriched;
  });

  const field = (key: keyof SupplierFormData, label: string, placeholder?: string, multiline?: boolean) => (
    <div className="flex flex-col gap-xs">
      <label className="font-label-md text-on-surface">
        {label}{key === 'name' && <span className="text-error"> *</span>}
      </label>
      {multiline ? (
        <textarea
          value={formData[key]}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary resize-none h-20"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          required={key === 'name'}
          value={formData[key]}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
          className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      await db.suppliers.add({
        id: Date.now().toString(),
        name: formData.name,
        contact: formData.contact || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
        createdAt: new Date(),
      });
      setIsAddModalOpen(false);
      setFormData(emptyForm);
    } catch (err) {
      console.error('Failed to add supplier', err);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formData.name.trim()) return;
    try {
      await db.suppliers.update(editItem.id, {
        name: formData.name,
        contact: formData.contact || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      });
      setEditItem(null);
      setFormData(emptyForm);
    } catch (err) {
      console.error('Failed to update supplier', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await db.transaction('rw', db.suppliers, db.barangSupplier, async () => {
        await db.barangSupplier.where('supplierId').equals(deleteItem.id).delete();
        await db.suppliers.delete(deleteItem.id);
      });
      setDeleteItem(null);
    } catch (err) {
      console.error('Failed to delete supplier', err);
    }
  };

  const seedDummySuppliers = async () => {
    const dummies = [
      {
        id: 'dummy-supplier-001',
        name: 'CV Tekstil Jaya',
        contact: 'Pak Ahmad',
        phone: '08123456789',
        address: 'Jl. Industri No. 12, Bandung',
        notes: 'Supplier utama kain pashmina & voal.',
        createdAt: new Date(),
      },
      {
        id: 'dummy-supplier-002',
        name: 'Toko Kain Nusantara',
        contact: 'Bu Sari',
        phone: '082234567890',
        address: 'Jl. Pasar Baru No. 45, Jakarta',
        notes: 'Tersedia bahan kaos dan rayon.',
        createdAt: new Date(),
      },
      {
        id: 'dummy-supplier-003',
        name: 'Supplier Voilee',
        contact: 'Pak Budi',
        phone: '081345678901',
        address: 'Jl. Raya Voil No. 7, Surabaya',
        notes: 'Supplier resmi produk brand Voilee.',
        createdAt: new Date(),
      },
    ];
    try {
      await db.suppliers.bulkAdd(dummies);
    } catch (err) {
      console.error('Failed to seed dummy suppliers', err);
    }
  };

  const openEdit = (e: React.MouseEvent, item: Supplier) => {
    e.stopPropagation();
    setEditItem(item);
    setFormData({
      name: item.name,
      contact: item.contact || '',
      phone: item.phone || '',
      address: item.address || '',
      notes: item.notes || '',
    });
  };

  const SupplierForm: React.FC<{ onSubmit: (e: React.FormEvent) => void; submitLabel: string; onCancel: () => void }> = ({ onSubmit, submitLabel, onCancel }) => (
    <form onSubmit={onSubmit} className="p-md flex flex-col gap-md">
      {field('name', 'Nama Supplier', 'Contoh: CV Tekstil Jaya')}
      {field('contact', 'Nama Kontak', 'Contoh: Pak Ahmad')}
      {field('phone', 'Nomor Telepon', '081234567890')}
      {field('address', 'Alamat', 'Jl. Contoh No. 1, Kota')}
      {field('notes', 'Catatan', 'Catatan tambahan...', true)}
      <div className="flex justify-end gap-sm mt-sm">
        <button type="button" onClick={onCancel} className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer">
          Batal
        </button>
        <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer">
          {submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Supplier</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola daftar supplier dan hubungkan dengan barang.</p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setIsAddModalOpen(true); }}
          className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah
        </button>
      </div>

      {!suppliers ? (
        <div className="flex justify-center py-xl">
          <p className="text-on-surface-variant">Memuat data...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <>
          <EmptyState
            icon="local_shipping"
            title="Belum ada supplier"
            description="Tambahkan supplier untuk menghubungkan dengan barang."
          />
          <div className="flex justify-center mt-sm">
            <button
              onClick={seedDummySuppliers}
              className="flex items-center gap-xs px-md py-sm bg-surface-container text-on-surface-variant border border-surface-variant rounded-lg hover:bg-surface-variant transition-colors font-label-md text-label-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Tambah Data Contoh
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-sm">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              onClick={() => navigate(`/supplier/${sup.id}`)}
              className="bg-surface-container-lowest rounded-xl border border-surface-variant p-md cursor-pointer hover:shadow-md hover:border-primary-fixed-dim transition-all flex items-center gap-md"
            >
              {/* Icon */}
              <div className="w-12 h-12 flex items-center justify-center bg-secondary-container rounded-xl text-on-secondary-container flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-h3 text-h3 text-on-surface truncate">{sup.name}</h3>
                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-xs">
                  {sup.contact && (
                    <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">person</span>
                      {sup.contact}
                    </span>
                  )}
                  {sup.phone && (
                    <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">phone</span>
                      {sup.phone}
                    </span>
                  )}
                  <span className="text-body-sm text-on-surface-variant bg-surface-variant/30 px-xs py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">inventory_2</span>
                    {sup.barangCount} barang
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => openEdit(e, sup)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteItem(sup); }}
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
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Supplier">
        <SupplierForm onSubmit={handleAdd} submitLabel="Simpan" onCancel={() => setIsAddModalOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => { setEditItem(null); setFormData(emptyForm); }} title="Edit Supplier">
        <SupplierForm onSubmit={handleEdit} submitLabel="Simpan Perubahan" onCancel={() => { setEditItem(null); setFormData(emptyForm); }} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${deleteItem?.name}"? Relasi dengan barang akan ikut terhapus.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        variant="danger"
      />
    </main>
  );
};

export default SupplierListPage;
