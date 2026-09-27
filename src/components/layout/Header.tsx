import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDataSync } from '../../hooks/useDataSync';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppModeStore } from '../../stores/useAppModeStore';
import Toast from '../ui/Toast';
import AccountSwitcherModal from '../auth/AccountSwitcherModal';
import AddAccountModal from '../auth/AddAccountModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { ROUTES } from '../../routes';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Lzist' }) => {
  const navigate = useNavigate();
  const { mode, setMode } = useAppModeStore();
  const { isOutOfSync, isSyncing, handleSync } = useDataSync();
  const { user, savedAccounts, switchAccount, logoutCurrent, isSwitching } = useAuthStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [modeToSwitch, setModeToSwitch] = useState<'offline' | 'online' | null>(null);

  const handleToggleMode = (newMode: 'offline' | 'online') => {
    if (mode === newMode) return;
    setModeToSwitch(newMode);
  };

  const confirmModeSwitch = () => {
    if (!modeToSwitch) return;
    setMode(modeToSwitch);
    window.location.reload();
  };

  const handleCheckUpdate = async () => {
    setIsChecking(true);

    // Check PWA Update
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (e) {
        console.error('Failed to check for PWA update:', e);
      }
    }

    // Give some feedback after a delay
    setTimeout(() => {
      setIsChecking(false);
      setToast({
        message: 'Pengecekan selesai. Aplikasi akan memberitahu jika ada versi baru.',
        type: 'info'
      });
      setTimeout(() => setToast(null), 3000);
    }, 1500);
  };

  const onConfirmSync = async () => {
    setIsConfirmOpen(false);
    await handleSync();
  };

  const handleLogout = async () => {
    setIsLogoutConfirmOpen(false);
    setIsUserMenuOpen(false);
    await logoutCurrent();
  };

  const handleSwitchAccount = async (accountId: string) => {
    setIsUserMenuOpen(false);
    const { error } = await switchAccount(accountId);
    if (error) {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast({ message: 'Berhasil beralih akun!', type: 'success' });
      setTimeout(() => setToast(null), 2500);
    }
  };

  const otherAccounts = savedAccounts.filter((acc) => acc.id !== user?.id);
  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-surface-variant shadow px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-sm sm:gap-md">
          <div className="md:hidden w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-base">inventory_2</span>
          </div>
          <h1 className="font-h2 text-[18px] sm:text-h2 text-on-surface truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">

          {/* Mode Badge / Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 sm:p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleToggleMode('offline')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'offline'
                  ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              title="Mode Offline: Penyimpanan Lokal"
            >
              <span className="material-symbols-outlined text-xs sm:text-sm">cloud_off</span>
              <span className="hidden sm:inline">Offline</span>
            </button>
            <button
              onClick={() => handleToggleMode('online')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'online'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              title="Mode Online: Penyimpanan Server & Sinkronisasi"
            >
              <span className="material-symbols-outlined text-xs sm:text-sm">cloud_done</span>
              <span className="hidden sm:inline">Online</span>
            </button>
          </div>

          {/* Update Data Button (Data Sync) */}
          {mode === 'offline' && isOutOfSync && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={isSyncing}
              title="Data master baru tersedia, klik untuk update"
              className="relative flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-lg transition-colors font-medium text-sm shadow-sm cursor-pointer"
            >
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
              <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'progress_activity' : 'sync'}
              </span>
              <span className="hidden md:inline">{isSyncing ? 'Memperbarui...' : 'Update Data'}</span>
            </button>
          )}

          <button
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className="flex items-center justify-center gap-1 md:gap-2 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg transition-colors font-medium text-sm border border-outline/20 shadow-sm disabled:opacity-50 cursor-pointer"
            title="Cek Update Aplikasi PWA"
          >
            <span className={`material-symbols-outlined text-sm ${isChecking ? 'animate-spin' : ''}`}>
              {isChecking ? 'progress_activity' : 'sync'}
            </span>
            <span className="hidden md:inline">{isChecking ? 'Mengecek...' : 'Cek Update'}</span>
          </button>

          <NavLink
            to={ROUTES.RESTOCK.NEW}
            className="flex items-center justify-center gap-1 md:gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="hidden sm:inline">New Entry</span>
          </NavLink>

          {/* User Profile Menu (Online Mode) or Quick Login Button */}
          {mode === 'online' ? (
            user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center cursor-pointer border border-teal-200 dark:border-teal-800 overflow-hidden shadow-xs hover:ring-2 hover:ring-teal-500 transition-all"
                  title="Profil & Pengaturan Akun"
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userDisplayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-teal-600 text-base">person</span>
                  )}
                  {savedAccounts.length > 1 && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal-500 border-2 border-white rounded-full"></span>
                  )}
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-outline-variant/20">
                    {/* Active Account Info */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0 overflow-hidden border border-teal-200">
                          {userAvatar ? (
                            <img src={userAvatar} alt={userDisplayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-teal-600">person</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-on-surface truncate">{userDisplayName}</p>
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300 rounded">
                              Aktif
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Other Saved Accounts */}
                    {otherAccounts.length > 0 && (
                      <div className="py-2 px-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 px-2 mb-1.5">
                          Beralih Akun
                        </p>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {otherAccounts.map((acc) => (
                            <button
                              key={acc.id}
                              onClick={() => handleSwitchAccount(acc.id)}
                              disabled={isSwitching}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-surface-container text-left transition-colors cursor-pointer group disabled:opacity-50"
                            >
                              <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 overflow-hidden text-on-surface-variant">
                                {acc.avatarUrl ? (
                                  <img src={acc.avatarUrl} alt={acc.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="material-symbols-outlined text-sm">person</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-on-surface truncate group-hover:text-teal-600 transition-colors">
                                  {acc.fullName}
                                </p>
                                <p className="text-[11px] text-on-surface-variant truncate">{acc.email}</p>
                              </div>
                              <span className="material-symbols-outlined text-sm text-on-surface-variant/50 group-hover:text-teal-600">
                                swap_horiz
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="py-1.5 px-2 space-y-0.5">
                      <NavLink
                        to={ROUTES.PROFILE.INDEX}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">settings</span>
                        <span>Pengaturan Profil</span>
                      </NavLink>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsAddAccountOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span>Tambah Akun Baru</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsAccountSwitcherOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">manage_accounts</span>
                        <span>Kelola Semua Sesi</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsLogoutConfirmOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        <span>Keluar dari Akun Ini</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-semibold hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span className="hidden sm:inline">Login</span>
              </button>
            )
          ) : null}
        </div>
      </header>

      {/* Account Switcher Modal */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Akun baru berhasil ditambahkan!', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
      />

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setIsLogoutConfirmOpen(false)}
        >
          <div
            className="bg-surface p-xl rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200 max-w-ms w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-red-600">logout</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface text-base">Keluar dari Akun?</h3>
                <p className="text-body-sm text-on-surface-variant font-body-sm mt-1">
                  Anda akan keluar dari sesi Lzist saat ini dan perlu login kembali untuk mengakses aplikasi online.
                </p>
              </div>
            </div>
            <div className="flex gap-sm justify-end mt-sm">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="px-md py-xs rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors font-label-md cursor-pointer shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Mode Switch Confirmation */}
      <ConfirmDialog
        isOpen={modeToSwitch !== null}
        title={modeToSwitch === 'online' ? 'Pindah ke Mode Online?' : 'Pindah ke Mode Offline?'}
        message={
          modeToSwitch === 'online'
            ? 'Aplikasi akan beralih ke Mode Online (Server). Halaman akan di-refresh dan Anda perlu login untuk melanjutkan.'
            : 'Aplikasi akan beralih ke Mode Offline (Data Lokal). Halaman akan di-refresh dan semua sesi login akan dinonaktifkan sementara.'
        }
        confirmLabel={modeToSwitch === 'online' ? 'Ya, Pindah Online' : 'Ya, Pindah Offline'}
        cancelLabel="Batal"
        variant={modeToSwitch === 'offline' ? 'danger' : 'default'}
        onConfirm={confirmModeSwitch}
        onCancel={() => setModeToSwitch(null)}
      />
    </>
  );
};

export default Header;
