import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { useEditKatalogBaru } from '../hooks/useEditKatalogBaru';
import { ROUTES } from '../routes';

const EditKatalogBaruPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // product_code
  const { toast, showToast, hideToast } = useToast();

  // Component-Local UI state
  const [massStock, setMassStock] = useState<number | ''>('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Extracted data-access & business logic hook
  const handleError = React.useCallback((msg: string) => {
    showToast(msg, 'error');
  }, [showToast]);

  const {
    isLoading,
    isSubmitting,
    isUnauthorized,
    notFound,
    formName,
    setFormName,
    formSkus,
    formPrice,
    setFormPrice,
    variants,
    availableColors,
    handleSkuChange,
    removeSku,
    handleVariantChange,
    handleAddVariant,
    handleRemoveVariant,
    uploadVariantImages,
    removeVariantImage,
    applyMassStock,
    saveProduct,
  } = useEditKatalogBaru({
    productId: id,
    onError: handleError,
  });

  const handleImageFileSelect = async (variantIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    e.target.value = '';

    const ok = await uploadVariantImages(variantIdx, fileList);
    if (ok) {
      showToast(`${fileList.length} gambar berhasil diunggah!`, 'success');
    }
  };

  const handleImageDelete = async (variantIdx: number, imgIdx: number) => {
    const ok = await removeVariantImage(variantIdx, imgIdx);
    if (ok) {
      showToast('Gambar berhasil dihapus', 'success');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi: pastikan semua varian memiliki nama warna
    if (variants.some(v => !v.name?.trim())) {
      showToast('Nama varian warna tidak boleh kosong!', 'error');
      return;
    }

    try {
      const success = await saveProduct();
      if (success) {
        showToast('Berhasil menyimpan perubahan!', 'success');
        navigate(ROUTES.KATALOG.INDEX);
      }
    } catch {
      showToast('Gagal menyimpan perubahan', 'error');
    }
  };

  const handleApplyMassStock = () => {
    if (massStock !== '') {
      applyMassStock(Number(massStock));
      setMassStock('');
    }
  };

  // ─── Loading Skeleton View ─────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="max-w-4lx mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <div className="flex items-center gap-sm">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-variant flex flex-col gap-md">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-variant flex flex-col gap-md">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-full" count={4} />
        </div>
      </main>
    );
  }

  // ─── Not Found View ───────────────────────────────────────────────
  if (notFound) {
    return (
      <main className="max-w-4lx mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <button
          onClick={() => navigate(ROUTES.KATALOG.INDEX)}
          className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline w-fit cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Katalog
        </button>
        <EmptyState
          icon="inventory_2"
          title="Produk Tidak Ditemukan"
          description="Produk yang Anda cari tidak ada atau telah dihapus."
        />
      </main>
    );
  }

  // ─── Unauthorized View ────────────────────────────────────────────
  if (isUnauthorized) {
    return (
      <main className="max-w-4lx mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        <button
          onClick={() => navigate(ROUTES.KATALOG.INDEX)}
          className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline w-fit cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Katalog
        </button>
        <EmptyState
          icon="lock"
          title="Akses Ditolak"
          description="Anda tidak memiliki izin untuk melihat atau mengedit produk ini karena bukan milik akun Anda."
        />
      </main>
    );
  }

  // ─── Main Form View ───────────────────────────────────────────────
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <main className="max-w-4lx mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
        {/* Header */}
        <div className="flex items-center gap-sm">
          <button
            onClick={() => navigate(ROUTES.KATALOG.INDEX)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">Edit Produk</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Ubah informasi barang (Supabase Online)</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-xl">
          {/* Card: Informasi Utama */}
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
                placeholder="Contoh: Pashmina Plisket"
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
                          className="p-2 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-xs flex-1">
                <label className="font-label-md text-on-surface">Harga Dasar (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value ? Number(e.target.value) : '')}
                  className="bg-surface-container px-md py-sm rounded-lg text-on-surface outline-none focus:ring-2 focus:ring-primary w-full"
                  placeholder="Contoh: 150000"
                />
              </div>
            </div>
          </div>

          {/* Card: Daftar Varian Warna */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant flex flex-col gap-md">
            <div className="flex p-md flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="flex items-center gap-sm">
                <h2 className="font-h3 text-h3 text-on-surface">Daftar Varian Warna</h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-sm py-1 bg-surface-container hover:bg-surface-variant text-on-surface text-label-md rounded-md border border-surface-variant transition-colors flex items-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tambah Warna
                </button>
              </div>

              {variants.length > 0 && (
                <div className="flex p-md items-center gap-sm">
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
                      onClick={handleApplyMassStock}
                      className="bg-primary hover:bg-primary/90 text-on-primary px-sm py-1.5 rounded-r-md text-label-md font-label-md transition-colors border border-primary cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {variants.length === 0 ? (
              <p className="text-on-surface-variant p-md bg-surface-container px-md py-sm rounded-lg mx-md mb-md">
                Belum ada varian warna untuk barang ini.
              </p>
            ) : (
              <div className="overflow-x-auto p-md w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-surface-variant text-on-surface-variant">
                      <th className="pb-sm font-label-md w-1/3">Nama Warna</th>
                      <th className="pb-sm font-label-md w-32">Stok</th>
                      <th className="pb-sm font-label-md">Gambar</th>
                      <th className="pb-sm font-label-md w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={v.id} className="border-b border-surface-variant/50 last:border-0">
                        <td className="py-sm pr-sm">
                          <input
                            type="text"
                            list="available-colors-list"
                            value={v.name}
                            onChange={(e) => {
                              const typedName = e.target.value;
                              handleVariantChange(idx, 'name', typedName);
                              const matched = availableColors.find(
                                (c) => c.color.toLowerCase() === typedName.trim().toLowerCase()
                              );
                              if (matched) {
                                handleVariantChange(idx, 'color_id', matched.color_id);
                              }
                            }}
                            placeholder="Ketik atau pilih warna..."
                            className="w-full bg-surface-container px-sm py-1.5 rounded-md text-on-surface outline-none focus:ring-2 focus:ring-primary text-body-md placeholder:text-on-surface-variant/40"
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
                          <div className="flex flex-wrap gap-2 items-center text-sm text-on-surface-variant">
                            {v.images && v.images.length > 0 ? (
                              v.images.map((imgItem, imgIdx) => {
                                const imgUrl = typeof imgItem === 'string' ? imgItem : imgItem.url;
                                return (
                                  <div key={imgIdx} className="relative group w-12 h-12 shrink-0">
                                    <img
                                      src={imgUrl}
                                      alt={`Varian ${v.name} - ${imgIdx + 1}`}
                                      loading="lazy"
                                      decoding="async"
                                      onClick={() => setViewingImage(imgUrl)}
                                      className="w-12 h-12 object-cover rounded-lg border border-surface-variant cursor-pointer hover:scale-105 hover:ring-2 hover:ring-primary transition-all shadow-xs"
                                      title="Klik untuk memperbesar"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.onerror = null;
                                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageDelete(idx, imgIdx);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                      title="Hapus gambar ini"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">close</span>
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-on-surface-variant/70 italic mr-1">Belum ada foto</span>
                            )}
                            <label
                              className="w-12 h-12 rounded-lg border-2 border-dashed border-surface-variant text-on-surface-variant flex items-center justify-center hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                              title="Upload Gambar Varian"
                            >
                              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => handleImageFileSelect(idx, e)}
                              />
                            </label>
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

          {/* Bottom Sticky Action Bar */}
          <div className="sticky bottom-4 z-10 flex justify-end gap-sm bg-surface-container-lowest p-md rounded-xl border border-surface-variant shadow-lg mt-md">
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
              Simpan Perubahan
            </button>
          </div>
        </form>

        {/* Datalist Autocomplete Pilihan Warna */}
        <datalist id="available-colors-list">
          {availableColors.map((c) => (
            <option key={c.color_id} value={c.color} />
          ))}
        </datalist>

        {/* Modal: Image Preview */}
        <Modal isOpen={!!viewingImage} onClose={() => setViewingImage(null)} title="Lihat Gambar">
          <div className="p-md flex justify-center">
            {viewingImage && (
              <img src={viewingImage} alt="Preview Besar" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            )}
          </div>
        </Modal>

        {/* Popup Spinner Overlay */}
        <LoadingSpinner isOpen={isSubmitting} title="Menyimpan perubahan..." />
      </main>
    </>
  );
};

export default EditKatalogBaruPage;
