import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDataSync } from '../../hooks/useDataSync';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'Lzist', onMenuClick }) => {
  const { isOutOfSync, isSyncing, handleSync } = useDataSync();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const onConfirmSync = async () => {
    setIsConfirmOpen(false);
    await handleSync();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-surface-variant px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-sm sm:gap-md">
          <div className="md:hidden w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-base">inventory_2</span>
          </div>
          <h1 className="font-h2 text-[18px] sm:text-h2 text-on-surface truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">

          {/* Update Data Button — only visible when INITIAL_DATA has changed */}
          {isOutOfSync && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={isSyncing}
              title="Data master baru tersedia, klik untuk update"
              className="relative flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-lg transition-colors font-medium text-sm shadow-sm cursor-pointer"
            >
              {/* Ping indicator */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
              <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'progress_activity' : 'sync'}
              </span>
              <span className="hidden sm:inline">{isSyncing ? 'Memperbarui...' : 'Update Data'}</span>
            </button>
          )}

          <NavLink
            to="/restock/new"
            className="flex items-center justify-center gap-1 md:gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="hidden sm:inline">New Entry</span>
          </NavLink>

          <div className="md:hidden w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center cursor-pointer border border-teal-200 dark:border-teal-800">
            <span className="material-symbols-outlined text-teal-600 text-base">person</span>
          </div>
        </div>
      </header>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            className="bg-surface p-xl rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200 max-w-ms w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-amber-600">sync</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface text-base">Update Data Katalog?</h3>
                <p className="text-body-sm text-on-surface-variant font-body-sm mt-1">
                  Data master terbaru terdeteksi. Seluruh data katalog Anda (termasuk editan stok dan varian kustom) akan <strong>dihapus</strong> dan digantikan dengan data terbaru dari pengembang.
                </p>
              </div>
            </div>
            <div className="flex gap-sm justify-end mt-sm">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={onConfirmSync}
                className="px-md py-xs rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-colors font-label-md cursor-pointer shadow-sm"
              >
                Ya, Update Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
