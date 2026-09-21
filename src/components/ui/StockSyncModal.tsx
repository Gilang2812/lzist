import React, { useState, useMemo } from 'react';
import type { AppMode } from '../../stores/useAppModeStore';

export interface StockSyncItem {
  productName: string;
  variantName: string;
  stock: number;
  quantity: number;
  result: number;
  categoryId?: string;
  variantId?: string;
}

interface StockSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockSyncItem[];
  isLoading: boolean;
  appMode: AppMode;
  stockSource: 'online' | 'offline';
  onToggleStockSource: (source: 'online' | 'offline') => void;
  title?: string;
  isSinkron?: boolean;
  onConfirmSync?: (isRestore: boolean) => Promise<void> | void;
  isSyncingAction?: boolean;
}

const StockSyncModal: React.FC<StockSyncModalProps> = ({
  isOpen,
  onClose,
  items,
  isLoading,
  appMode,
  stockSource,
  onToggleStockSource,
  title = 'Sinkronisasi Stok',
  isSinkron = false,
  onConfirmSync,
  isSyncingAction = false,
}) => {
  const [search, setSearch] = useState('');
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Compute items based on isRestoreMode (if restore: stock + quantity, else: stock - quantity)
  const displayItems = useMemo(() => {
    return items.map((item) => {
      const calculatedResult = isRestoreMode
        ? item.stock + item.quantity
        : item.stock - item.quantity;
      return {
        ...item,
        result: calculatedResult,
      };
    });
  }, [items, isRestoreMode]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return displayItems;
    const q = search.toLowerCase();
    return displayItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.variantName.toLowerCase().includes(q)
    );
  }, [displayItems, search]);

  const totalShortage = useMemo(
    () => filteredItems.filter((i) => !isRestoreMode && i.result < 0).length,
    [filteredItems, isRestoreMode]
  );

  const handleExecuteSync = async () => {
    setShowConfirmModal(false);
    if (onConfirmSync) {
      await onConfirmSync(isRestoreMode);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2lx max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-xl">
                sync
              </span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                {items.length} item
              </span>
              {isSinkron && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  Tersinkron
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-gray-500 text-lg">close</span>
            </button>
          </div>

          {/* Toolbar: Search + Mode Source + Restore Toggle */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Cari produk atau variasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {/* Online/Offline source toggle — only in online appMode */}
              {appMode === 'online' && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleStockSource('online')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${stockSource === 'online'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    <span className="material-symbols-outlined text-xs">cloud</span>
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStockSource('offline')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${stockSource === 'offline'
                        ? 'bg-gray-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    <span className="material-symbols-outlined text-xs">smartphone</span>
                    Offline
                  </button>
                </div>
              )}

              {/* Offline-only badge */}
              {appMode === 'offline' && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  <span className="material-symbols-outlined text-xs">smartphone</span>
                  Stok Offline
                </div>
              )}

              {/* Restore Toggle */}
              <button
                type="button"
                disabled={!isSyncingAction}
                onClick={() => setIsRestoreMode(!isRestoreMode)}
                className={`flex disabled:bg-slate-200 disabled:text-slate-300 disabled:border disabled:border-slate-300 items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${isRestoreMode
                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                title={isRestoreMode ? 'Nonaktifkan Mode Restore' : 'Aktifkan Mode Restore (Kembalikan Stok)'}
              >
                <span className="material-symbols-outlined text-xs">
                  {isRestoreMode ? 'history' : 'replay'}
                </span>
                <span>{isRestoreMode ? 'Mode Restore Aktif' : 'Opsi Restore'}</span>
              </button>
            </div>
          </div>

          {/* Mode Notification Banner */}
          {isRestoreMode ? (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-600 dark:text-amber-400">info</span>
                <span><strong>Mode Restore:</strong> Kolom Hasil menampilkan <strong>Stok + Jumlah</strong> (stok akan dikembalikan).</span>
              </div>
            </div>
          ) : isSinkron ? (
            <div className="px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs text-teal-800 dark:text-teal-200">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-teal-600 dark:text-teal-400">check_circle</span>
                <span>Data stok sudah pernah disinkronkan. Gunakan <strong>Opsi Restore</strong> jika ingin mengembalikan stok ke data master.</span>
              </div>
            </div>
          ) : null}

          {/* Content Table */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Memuat data stok...
                </span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600">
                  inventory_2
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {items.length === 0
                    ? 'Tidak ada data barang untuk disinkronkan.'
                    : 'Tidak ada hasil pencarian.'}
                </span>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 font-medium border-b border-gray-200 dark:border-gray-700">
                      Produk
                    </th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700">
                      Variasi
                    </th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 text-center w-20">
                      Stok
                    </th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 text-center w-20">
                      Jumlah
                    </th>
                    <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 text-center w-24">
                      {isRestoreMode ? 'Hasil (+)' : 'Hasil (-)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                        {item.variantName || '-'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {item.stock}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded-full text-[10px] font-bold ${isRestoreMode
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : item.result < 0
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : item.result === 0
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                            }`}
                        >
                          {item.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer summary & Action button */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] shrink-0 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-gray-500 dark:text-gray-400">
                Total: <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredItems.length}</span> item
              </span>
              {!isRestoreMode && totalShortage > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  {totalShortage} stok kurang
                </span>
              )}
              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <span className="material-symbols-outlined text-xs">
                  {stockSource === 'online' && appMode === 'online' ? 'cloud' : 'smartphone'}
                </span>
                <span>{stockSource === 'online' && appMode === 'online' ? 'Supabase' : 'Lokal (Dexie)'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {onConfirmSync && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                {isRestoreMode ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSyncingAction || items.length === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncingAction ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">history</span>
                    )}
                    <span>Kembalikan Stok (Restore)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSyncingAction || items.length === 0 || isSinkron}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${isSinkron
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isSinkron ? 'Sudah disinkronkan. Aktifkan Opsi Restore jika ingin mengembalikan.' : 'Terapkan pengurangan stok'}
                  >
                    {isSyncingAction ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-sm">sync</span>
                    )}
                    <span>{isSinkron ? 'Sudah Disinkronkan' : 'Terapkan Sinkronisasi'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Validation Modal (Popup to prevent accidental sync) */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-ms overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${isRestoreMode
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {isRestoreMode ? 'history' : 'sync'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {isRestoreMode ? 'Konfirmasi Restore Stok' : 'Konfirmasi Update Stok'}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Sumber: <span className="font-semibold text-gray-700 dark:text-gray-300">{stockSource === 'online' && appMode === 'online' ? 'Supabase' : 'Lokal (Dexie)'}</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                {isRestoreMode ? (
                  <p>
                    Apakah Anda yakin ingin <strong>mengembalikan (menambah) stok</strong> sebanyak {items.length} item ke data master katalog?
                  </p>
                ) : (
                  <p>
                    Apakah Anda yakin ingin <strong>memperbarui (mengurangi) stok</strong> sebanyak {items.length} item pada data master katalog?
                    <br />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">
                      * Jika hasil pengurangan bernilai minus, nilai minus tersebut tetap akan disimpan.
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer ${isRestoreMode
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                  }`}
              >
                {isRestoreMode ? 'Ya, Restore Stok' : 'Ya, Update Stok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StockSyncModal;
