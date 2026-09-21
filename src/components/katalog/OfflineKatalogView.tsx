import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Skeleton from '../ui/Skeleton';
import LoadingSpinner from '../ui/LoadingSpinner';
import Tooltip from '../ui/Tooltip';
import { ROUTES } from '../../routes';
import type { Barang, SubBarang } from '../../types';

const OfflineKatalogView: React.FC = () => {
  const navigate = useNavigate();
 
  const [deleteItem, setDeleteItem] = useState<Barang | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);

  const toggleSelectAll = (currentFiltered: any[]) => {
    if (selectedItems.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentFiltered.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDeleteAll = async () => {
    try {
      await db.transaction('rw', db.barang, db.subBarang, db.barangSupplier, async () => {
        await db.subBarang.clear();
        await db.barangSupplier.clear();
        await db.barang.clear();
      });
      setSelectedItems([]);
      setIsDeleteAllModalOpen(false);
    } catch (error) {
      console.error('Failed to delete all', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    try {
      await db.transaction('rw', db.barang, db.subBarang, db.barangSupplier, async () => {
        for (const id of selectedItems) {
          await db.subBarang.where('barangId').equals(id).delete();
          await db.barangSupplier.where('barangId').equals(id).delete();
          await db.barang.delete(id);
        }
      });
      setSelectedItems([]);
      setIsDeleteSelectedModalOpen(false);
    } catch (error) {
      console.error('Failed to delete selected', error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<Map<string, any[]> | null>(null);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [spinnerMessage, setSpinnerMessage] = useState('');

 
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

    return enriched.sort((a, b) => a.name.localeCompare(b.name));
  });

  const filteredBarangs = barangs?.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Group by SKU Induk or Nama Produk
      const groups = new Map<string, any[]>();
      for (const row of jsonData) {
        const parentKey = (row['SKU Induk'] || row['Nama Produk'] || '').toString().trim();
        if (!parentKey) continue;
        
        if (!groups.has(parentKey)) {
          groups.set(parentKey, []);
        }
        groups.get(parentKey)!.push(row);
      }

      if (groups.size > 0) {
        setImportPreviewData(groups);
      } else {
        setNotification({ title: 'Info', message: 'Tidak ada data produk yang ditemukan dalam file.', type: 'info' });
      }
    } catch (error) {
      console.error('Error parsing excel:', error);
      setNotification({ title: 'Error', message: 'Terjadi kesalahan saat membaca Excel. Pastikan format sesuai.', type: 'error' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importPreviewData) return;
    setSpinnerMessage('Mengimpor data Excel...');
    setIsConfirmingImport(true);
    try {
      await db.transaction('rw', db.barang, db.subBarang, async () => {
        for (const [parentKey, rows] of importPreviewData.entries()) {
          const firstRow = rows[0];
          const productName = firstRow['Nama Produk'] || parentKey;
          const skuInduk = firstRow['SKU Induk'] ? firstRow['SKU Induk'].toString().trim() : '';

          // Find if Barang exists
          let barang: Barang | undefined;
          if (skuInduk) {
            const allBarangs = await db.barang.toArray();
            barang = allBarangs.find(b => b.skus?.includes(skuInduk));
          }
          if (!barang) {
            barang = await db.barang.where('name').equals(productName).first();
          }

          let barangId = barang?.id;
          if (!barangId) {
            barangId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            await db.barang.add({
              id: barangId,
              name: productName,
              skus: skuInduk ? [skuInduk] : [],
              createdAt: new Date(),
              updatedAt: new Date(),
              price: firstRow['Harga'] ? Number(firstRow['Harga']) : undefined
            });
          } else if (skuInduk && barang && barang.skus && !barang.skus.includes(skuInduk)) {
             await db.barang.update(barangId, { skus: [...barang.skus, skuInduk] });
          }

          // Process variations
          for (const row of rows) {
            const variasi = row['Variasi'] || row['Variasi ID'] || 'Default';
            const sku = row['SKU'] ? row['SKU'].toString().trim() : '';
            const stock = row['Stok'] ? Number(row['Stok']) : 0;
            
            let subBarang: SubBarang | undefined;
            const existingSubBarangs = await db.subBarang.where('barangId').equals(barangId).toArray();
            subBarang = existingSubBarangs.find(sb => sb.name === variasi.toString());

            if (subBarang) {
              await db.subBarang.update(subBarang.id, { stock });
            } else {
              await db.subBarang.add({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                barangId,
                name: variasi.toString(),
                sku,
                stock
              });
            }
          }
        }
      });
      setNotification({ title: 'Sukses', message: 'Impor Excel berhasil!', type: 'success' });
      setImportPreviewData(null);
    } catch (error) {
      console.error('Error importing excel:', error);
      setNotification({ title: 'Error', message: 'Terjadi kesalahan saat mengimpor data ke database.', type: 'error' });
    } finally {
      setIsConfirmingImport(false);
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

  const openDeleteModal = (e: React.MouseEvent, item: Barang) => {
    e.stopPropagation();
    setDeleteItem(item);
  };

 

  return (
    <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-md items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-xs">
            <h1 className="font-h1 text-h1 text-on-surface">Katalog Barang</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-surface-variant">
              <span className="material-symbols-outlined text-[14px]">cloud_off</span>
              Offline Lokal
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola inventaris tersimpan di perangkat lokal.</p>
        </div>
        <div className="flex items-center gap-sm w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container pl-10 pr-4 py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`border border-surface-variant text-on-surface px-md sm:px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-xs cursor-pointer shrink-0 ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-[18px]">{isImporting ? 'sync' : 'upload_file'}</span>
            {isImporting ? 'Mengimpor...' : 'Import Excel'}
          </button>
          <Tooltip content="Big Seller > Menu Produk Live Shopee > Tombol Import & Export > Export yang dipilih/ Export perhalaman">
            <button
              type="button"
              aria-label="Petunjuk mendapatkan file Excel"
              title="Petunjuk mendapatkan file Excel"
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
            </button>
          </Tooltip>
          <a
            href={ROUTES.KATALOG.TAMBAH}
            className="bg-primary text-on-primary px-md sm:px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah
          </a>
        </div>
      </div>

      {!barangs ? (
        <Skeleton className="h-20 w-full" count={5} />
      ) : filteredBarangs.length === 0 ? (
        <EmptyState
          icon={barangs.length === 0 ? "menu_book" : "search_off"}
          title={barangs.length === 0 ? "Katalog masih kosong" : "Barang tidak ditemukan"}
          description={barangs.length === 0 ? "Tambahkan barang pertama untuk memulai mengelola inventaris." : "Coba gunakan kata kunci pencarian yang lain."}
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {filteredBarangs.length > 0 && (
            <div className="flex items-center gap-4 py-2 px-md bg-surface-container-lowest rounded-xl border border-surface-variant">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === filteredBarangs.length && filteredBarangs.length > 0} 
                  onChange={() => toggleSelectAll(filteredBarangs)} 
                  className="w-4 h-4 text-primary bg-surface-container border-surface-variant rounded focus:ring-primary cursor-pointer"
                />
                <span className="text-body-sm text-on-surface font-medium">Pilih Semua</span>
              </label>
              
              <div className="flex items-center gap-2 ml-auto">
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setIsDeleteSelectedModalOpen(true)}
                    className="text-error hover:bg-error-container/50 px-3 py-1.5 rounded-lg text-label-sm font-label-md transition-colors border border-error/30 cursor-pointer"
                  >
                    Hapus Terpilih ({selectedItems.length})
                  </button>
                )}
                <button
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="text-error hover:bg-error-container/50 px-3 py-1.5 rounded-lg text-label-sm font-label-md transition-colors border border-error/30 cursor-pointer"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
          )}

          {filteredBarangs.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(ROUTES.KATALOG.detail(item.id))}
              className="bg-surface-container-lowest rounded-xl border border-surface-variant border-l-4 border-l-primary-fixed-dim p-md cursor-pointer hover:shadow-md hover:border-l-primary transition-all flex gap-md items-center"
            >
              <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="w-4 h-4 text-primary bg-surface-container border-surface-variant rounded focus:ring-primary cursor-pointer"
                />
              </div>

              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg bg-surface-container shrink-0" />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-surface-container rounded-lg text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">inventory_2</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-label-lg text-label-lg sm:font-h3 sm:text-h3 text-on-surface truncate" title={item.name}>{item.name}</h3>
                <div className="flex items-center gap-1 sm:gap-xs mt-1 sm:mt-xs flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-medium text-on-surface-variant bg-surface-variant/40 px-xs py-0.5 rounded">
                    {item.variantCount} Varian
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-on-surface-variant">·</span>
                  <span className="text-[10px] sm:text-[11px] text-on-surface-variant">
                    Stok <strong className={item.totalStock === 0 ? 'text-error' : 'text-on-surface'}>{item.totalStock}</strong>
                  </span>
                  {item.skus && item.skus.length > 0 && (
                    <>
                      <span className="text-[10px] sm:text-[11px] text-on-surface-variant">·</span>
                      <span className="text-[10px] sm:text-[11px] text-on-surface-variant max-w-sx truncate" title={item.skus.join(', ')}>
                        SKU: {item.skus.join(', ')}
                      </span>
                    </>
                  )}
                  {item.supplierNames.length > 0 && (
                    <>
                      <span className="text-[10px] sm:text-[11px] text-on-surface-variant">·</span>
                      {item.supplierNames.map(s => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] text-on-secondary-container bg-secondary-container px-xs py-0.5 rounded-full leading-none"
                        >
                          <span className="material-symbols-outlined text-[10px] sm:text-[11px]">local_shipping</span>
                          {s}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => navigate(ROUTES.KATALOG.detail(item.id))}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors"
                  title="Lihat Detail"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.KATALOG.edit(item.id));
                  }}
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

 
\\
      {/* Import Preview Modal */}
      <Modal isOpen={!!importPreviewData} onClose={() => !isConfirmingImport && setImportPreviewData(null)} title="Konfirmasi Impor Data">
        <div className="p-md flex flex-col gap-md max-h-[70vh] overflow-hidden">
          <p className="text-body-md text-on-surface-variant">
            Ditemukan {importPreviewData?.size || 0} produk unik. Berikut adalah daftar produk beserta variasinya yang akan diimpor atau diperbarui:
          </p>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-sm">
            {importPreviewData && Array.from(importPreviewData.entries()).map(([parentKey, rows], idx) => {
              const productName = rows[0]['Nama Produk'] || parentKey;
              return (
                <div key={idx} className="bg-surface-container rounded-lg p-sm border border-surface-variant">
                  <p className="font-label-md text-on-surface mb-xs">{productName}</p>
                  <ul className="text-body-sm text-on-surface-variant list-disc pl-5">
                    {rows.map((row, i) => {
                       const variasi = row['Variasi'] || row['Variasi ID'] || 'Default';
                       const stock = row['Stok'] || 0;
                       return <li key={i}>{variasi} (Stok: {stock})</li>;
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-sm pt-sm border-t border-surface-variant">
            <button
              type="button"
              onClick={() => setImportPreviewData(null)}
              disabled={isConfirmingImport}
              className="px-md py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={isConfirmingImport}
              className={`px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer flex items-center gap-2 ${isConfirmingImport ? 'opacity-70' : ''}`}
            >
              {isConfirmingImport && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              Mulai Impor
            </button>
          </div>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal isOpen={!!notification} onClose={() => setNotification(null)} title={notification?.title || 'Notifikasi'}>
        <div className="p-md flex flex-col gap-md">
          <div className={`flex items-center gap-sm p-sm rounded-lg ${
            notification?.type === 'success' ? 'bg-primary-container text-on-primary-container' :
            notification?.type === 'error' ? 'bg-error-container text-on-error-container' :
            'bg-surface-container-high text-on-surface'
          }`}>
            <span className="material-symbols-outlined text-[24px]">
              {notification?.type === 'success' ? 'check_circle' : notification?.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="text-body-md">
              {notification?.message}
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
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

      <ConfirmDialog
        isOpen={isDeleteAllModalOpen}
        title="Hapus Semua Barang"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA barang beserta semua variannya dari katalog? Tindakan ini tidak dapat dibatalkan dan akan mengosongkan katalog Anda."
        confirmLabel="Hapus Semua"
        cancelLabel="Batal"
        onConfirm={handleDeleteAll}
        onCancel={() => setIsDeleteAllModalOpen(false)}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={isDeleteSelectedModalOpen}
        title="Hapus Barang Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedItems.length} barang terpilih beserta semua variannya? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Terpilih"
        cancelLabel="Batal"
        onConfirm={handleDeleteSelected}
        onCancel={() => setIsDeleteSelectedModalOpen(false)}
        variant="danger"
      />

      <LoadingSpinner isOpen={ isConfirmingImport} title={spinnerMessage} />
    </main>
  );
};

export default OfflineKatalogView;
