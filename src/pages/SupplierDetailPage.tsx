import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface SupplierFormData {
  name: string;
  contact: string;
  phone: string;
  address: string;
  notes: string;
}

const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({ name: '', contact: '', phone: '', address: '', notes: '' });

  // State for detach barang confirm
  const [detachBarangId, setDetachBarangId] = useState<string | null>(null);

  const data = useLiveQuery(async () => {
    if (!id) return null;
    const supplier = await db.suppliers.get(id);
    if (!supplier) return null;

    // fetch linked barang
    const links = await db.barangSupplier.where('supplierId').equals(id).toArray();
    const linkedBarang = await Promise.all(links.map(async (link) => {
      const b = await db.barang.get(link.barangId);
      if (!b) return null;
      const subs = await db.subBarang.where('barangId').equals(b.id).toArray();
      const totalStock = subs.reduce((s, v) => s + (v.stock || 0), 0);
      return { ...b, variantCount: subs.length, totalStock };
    }));

    return { supplier, linkedBarang: linkedBarang.filter(Boolean) };
  }, [id]);

  if (data === undefined) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full">
        <p className="text-on-surface-variant text-center py-xl">Memuat data...</p>
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-xs text-primary font-label-md hover:underline w-fit cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <EmptyState icon="local_shipping" title="Supplier Tidak Ditemukan" description="Supplier yang Anda cari tidak ada atau telah dihapus." />
      </main>
    );
  }

  const { supplier, linkedBarang } = data;

  const openEdit = () => {
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      await db.suppliers.update(id!, {
        name: formData.name,
        contact: formData.contact || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update supplier', err);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await db.transaction('rw', db.suppliers, db.barangSupplier, async () => {
        await db.barangSupplier.where('supplierId').equals(id).delete();
        await db.suppliers.delete(id);
      });
      navigate('/supplier', { replace: true });
    } catch (err) {
      console.error('Failed to delete supplier', err);
    }
  };

  const handleDetach = async () => {
    if (!detachBarangId || !id) return;
    try {
      await db.barangSupplier
        .where('barangId').equals(detachBarangId)
        .and(r => r.supplierId === id)
        .delete();
      setDetachBarangId(null);
    } catch (err) {
      console.error('Failed to detach barang', err);
    }
  };

  const inputCls = 'bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary w-full';

  const infoRow = (icon: string, value?: string) =>
    value ? (
      <div className="flex items-start gap-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">{icon}</span>
        <span className="text-body-md">{value}</span>
      </div>
    ) : null;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline w-fit cursor-pointer">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Supplier
      </button>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-lg flex flex-col gap-md">
        <div className="flex items-start justify-between gap-md">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 flex items-center justify-center bg-secondary-container rounded-2xl text-on-secondary-container flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]">local_shipping</span>
            </div>
            <div>
              <h1 className="font-h1 text-h1 text-on-surface">{supplier.name}</h1>
              <p className="text-body-sm text-on-surface-variant mt-xs">
                {linkedBarang.length} barang terhubung
              </p>
            </div>
          </div>
          <div className="flex items-center gap-xs flex-shrink-0">
            <button
              onClick={openEdit}
              className="flex items-center gap-xs px-md py-sm bg-surface-container text-on-surface font-label-md rounded-lg hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-xs px-md py-sm bg-error-container text-on-error-container font-label-md rounded-lg hover:bg-error hover:text-on-error transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Hapus
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-sm pt-sm border-t border-surface-variant">
          {infoRow('person', supplier.contact)}
          {infoRow('phone', supplier.phone)}
          {infoRow('location_on', supplier.address)}
          {infoRow('notes', supplier.notes)}
          {!supplier.contact && !supplier.phone && !supplier.address && !supplier.notes && (
            <p className="text-body-sm text-on-surface-variant italic">Belum ada informasi kontak.</p>
          )}
        </div>
      </div>

      {/* Linked Barang */}
      <div className="flex flex-col gap-md">
        <h2 className="font-h2 text-h2 text-on-surface border-b border-surface-variant pb-xs">
          Barang dari Supplier Ini
        </h2>

        {linkedBarang.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="Belum ada barang"
            description="Hubungkan barang ke supplier ini dari halaman Katalog."
          />
        ) : (
          <div className="flex flex-col gap-sm">
            {linkedBarang.map((b) => {
              if (!b) return null;
              return (
                <div
                  key={b.id}
                  className="bg-surface-container-lowest border border-surface-variant rounded-xl p-md flex items-center gap-md hover:bg-surface-container-low transition-colors group"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/katalog/${b.id}`)}
                  >
                    <h3 className="font-label-lg text-label-lg text-on-surface truncate">{b.name}</h3>
                    <div className="flex items-center gap-sm mt-xs text-body-sm text-on-surface-variant">
                      <span>{b.variantCount} varian</span>
                      <span>•</span>
                      <span>Stok: <strong className="text-on-surface">{b.totalStock}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetachBarangId(b.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container rounded-md text-on-surface-variant hover:text-error hover:bg-error-container cursor-pointer flex-shrink-0"
                    title="Lepas dari supplier ini"
                  >
                    <span className="material-symbols-outlined text-[16px]">link_off</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Supplier">
        <form onSubmit={handleEdit} className="p-md flex flex-col gap-md">
          {(['name', 'contact', 'phone', 'address'] as const).map((key) => (
            <div key={key} className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface capitalize">
                {key === 'name' ? 'Nama Supplier' : key === 'contact' ? 'Nama Kontak' : key === 'phone' ? 'Nomor Telepon' : 'Alamat'}
                {key === 'name' && <span className="text-error"> *</span>}
              </label>
              <input
                type="text"
                required={key === 'name'}
                value={formData[key]}
                onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                className={inputCls}
              />
            </div>
          ))}
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface">Catatan</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className={`${inputCls} resize-none h-20`}
            />
          </div>
          <div className="flex justify-end gap-sm mt-sm">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete supplier confirm */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${supplier.name}"? Relasi dengan semua barang akan ikut terhapus.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      {/* Detach barang confirm */}
      <ConfirmDialog
        isOpen={!!detachBarangId}
        title="Lepas Barang"
        message="Apakah Anda yakin ingin melepas hubungan barang ini dari supplier?"
        confirmLabel="Lepas"
        cancelLabel="Batal"
        onConfirm={handleDetach}
        onCancel={() => setDetachBarangId(null)}
        variant="danger"
      />
    </main>
  );
};

export default SupplierDetailPage;
