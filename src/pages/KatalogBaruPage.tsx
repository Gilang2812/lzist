import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../db/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Toast from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Tooltip from '../components/ui/Tooltip';
import { ROUTES } from '../routes';
import { useToast } from '../hooks/useToast';

const KatalogBaruPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spinnerTitle, setSpinnerTitle] = useState('');

  const [products, setProducts] = useState<any[] | null>(null);

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<Map<string, any[]> | null>(null);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }

    try {
      const { data: allProducts, error } = await supabase
        .from('product')
        .select(`
          *,
          product_color (
            product_id, color_id, stok, harga
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const enriched = (allProducts || []).map((p: any) => {
        const pColors = p.product_color || [];
        const totalStock = pColors.reduce((sum: number, pc: any) => sum + (pc.stok || 0), 0);
        return {
          ...p,
          variantCount: pColors.length,
          totalStock
        };
      }).sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

      setProducts(enriched);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setProducts([]);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products?.filter(item =>
    item.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

      const groups = new Map<string, any[]>();
      for (const row of jsonData) {
        const parentKey = (row['SKU Induk'] || row['Nama Produk'] || '').toString().trim();
        if (!parentKey) continue;
        if (!groups.has(parentKey)) groups.set(parentKey, []);
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
    if (!importPreviewData || !user) return;
    setSpinnerTitle('Mengimpor data Excel ke server...');
    setIsConfirmingImport(true);
    try {
      for (const [parentKey, rows] of importPreviewData.entries()) {
        const firstRow = rows[0];
        const productName = (firstRow['Nama Produk'] || parentKey).toString().trim();
        const skuInduk = firstRow['SKU Induk'] ? firstRow['SKU Induk'].toString().trim() : '';

        // Find or create product
        let productCode: string;
        const { data: existingProducts } = await supabase
          .from('product')
          .select('product_code')
          .eq('user_id', user.id)
          .eq('nama', productName)
          .limit(1);

        if (existingProducts && existingProducts.length > 0) {
          productCode = existingProducts[0].product_code;
        } else {
          productCode = 'PRD-' + Date.now() + Math.random().toString(36).substr(2, 4);
          const { error: productErr } = await supabase.from('product').insert([{
            product_code: productCode,
            user_id: user.id,
            nama: productName,
            price: firstRow['Harga'] ? Number(firstRow['Harga']) : 0,
          }]);
          if (productErr) throw productErr;
        }

        // Add SKU if present
        if (skuInduk) {
          const { data: existingSku } = await supabase
            .from('sku')
            .select('id_sku')
            .eq('product_code', productCode)
            .eq('name', skuInduk)
            .limit(1);
          if (!existingSku || existingSku.length === 0) {
            await supabase.from('sku').insert([{ product_code: productCode, name: skuInduk }]);
          }
        }

        // Process variants
        for (const row of rows) {
          const variasi = (row['Variasi'] || row['Variasi ID'] || 'Default').toString().trim();
          const stock = row['Stok'] ? Number(row['Stok']) : 0;

          // Find or create color
          let colorId: string;
          const { data: existingColors } = await supabase
            .from('color')
            .select('color_id')
            .eq('color', variasi)
            .limit(1);

          if (existingColors && existingColors.length > 0) {
            colorId = existingColors[0].color_id;
          } else {
            const { data: newColor, error: colorErr } = await supabase
              .from('color')
              .insert([{ color: variasi }])
              .select('color_id')
              .single();
            if (colorErr) throw colorErr;
            colorId = newColor.color_id;
          }

          // Upsert product_color
          const { data: existingPc } = await supabase
            .from('product_color')
            .select('product_id')
            .eq('product_id', productCode)
            .eq('color_id', colorId)
            .limit(1);

          if (existingPc && existingPc.length > 0) {
            await supabase
              .from('product_color')
              .update({ stok: stock })
              .eq('product_id', productCode)
              .eq('color_id', colorId);
          } else {
            await supabase.from('product_color').insert([{
              product_id: productCode,
              color_id: colorId,
              stok: stock,
              harga: 0,
            }]);
          }
        }
      }

      setNotification({ title: 'Sukses', message: 'Impor Excel ke server berhasil!', type: 'success' });
      setImportPreviewData(null);
      fetchProducts();
    } catch (error) {
      console.error('Error importing excel to Supabase:', error);
      setNotification({ title: 'Error', message: 'Terjadi kesalahan saat mengimpor data ke server.', type: 'error' });
    } finally {
      setIsConfirmingImport(false);
      setSpinnerTitle('');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !user) return;

    setIsSubmitting(true);
    setSpinnerTitle('Menambahkan produk...');
    try {
      const productCode = 'PRD-' + Date.now();

      const payload = {
        product_code: productCode,
        user_id: user.id,
        nama: formName,
        price: Number(formPrice) || 0,
      };

      const { error } = await supabase.from('product').insert([payload]);
      if (error) throw error;

      setIsAddModalOpen(false);
      setFormName('');
      setFormPrice('');
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
      showToast('Gagal menambahkan produk', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsSubmitting(true);
    setSpinnerTitle('Menghapus produk...');
    try {
      // Hard Delete dari Supabase
      const { error } = await supabase
        .from('product')
        .delete()
        .eq('product_code', deleteItem.product_code);

      if (error) throw error;

      setDeleteItem(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
      showToast('Gagal menghapus produk', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-md items-start sm:items-center justify-between">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-xs">Katalog Barang (Mode Server)</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Menggunakan koneksi real-time ke server.</p>
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
                className="flex size-4 items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">help</span>
              </button>
            </Tooltip>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-on-primary px-md sm:px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah
            </button>
          </div>
        </div>

        {!products ? (
          <Skeleton className="h-20 w-full" count={4} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon="menu_book"
            title="Katalog kosong"
            description="Tambahkan barang pertama."
          />
        ) : (
          <div className="flex flex-col gap-sm">
            {filteredProducts.map((item) => (
              <div
                key={item.product_code}
                className="bg-surface-container-lowest rounded-xl border border-surface-variant p-md flex gap-md items-center"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-label-lg text-on-surface truncate">{item.nama}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-surface-variant/40 px-2 py-1 rounded">
                      {item.variantCount} Varian Warna
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Stok: <strong>{item.totalStock}</strong>
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Kode: {item.product_code}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Harga: Rp {item.price?.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(ROUTES.KATALOG_BARU.edit(item.product_code))}
                    className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary-container"
                    title="Edit Produk"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteItem(item)}
                    className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error-container"
                    title="Hapus Produk"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Tambah */}
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Produks">
          <form onSubmit={handleAddSubmit} className="p-md flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface">Nama Produk <span className="text-error">*</span></label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-on-surface">Harga Dasar</label>
              <input
                type="number"
                value={formPrice}
                onChange={e => setFormPrice(Number(e.target.value))}
                className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-sm mt-sm">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-md py-sm font-label-md hover:bg-surface-container rounded-lg">Batal</button>
              <button type="submit" className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg">Simpan ke Server</button>
            </div>
          </form>
        </Modal>

        {/* Modal Hapus */}
        <ConfirmDialog
          isOpen={!!deleteItem}
          title="Hapus Produk"
          message={`Hapus produk "${deleteItem?.nama}"?`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          variant="danger"
        />

        {/* Import Preview Modal */}
        <Modal isOpen={!!importPreviewData} onClose={() => !isConfirmingImport && setImportPreviewData(null)} title="Konfirmasi Impor Data">
          <div className="p-md flex flex-col gap-md max-h-[70vh] overflow-hidden">
            <p className="text-body-md text-on-surface-variant">
              Ditemukan {importPreviewData?.size || 0} produk unik. Berikut adalah daftar produk beserta variasinya yang akan diimpor atau diperbarui ke server:
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
            <div className={`flex items-center gap-sm p-sm rounded-lg ${notification?.type === 'success' ? 'bg-primary-container text-on-primary-container' :
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

        <LoadingSpinner isOpen={isSubmitting || isConfirmingImport} title={spinnerTitle} />
      </main>
    </>
  );
};

export default KatalogBaruPage;
