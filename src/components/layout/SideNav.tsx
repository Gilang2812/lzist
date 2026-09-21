import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { OFFLINE_NAV_ITEMS, ONLINE_NAV_ITEMS } from '../../utils/constants';
import { ROUTES } from '../../routes';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppModeStore } from '../../stores/useAppModeStore';
import AccountSwitcherModal from '../auth/AccountSwitcherModal';
import ConfirmDialog from '../ui/ConfirmDialog';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const { mode, setMode } = useAppModeStore();
  const { isInstallable, handleInstallClick } = useInstallPrompt();
  const { user, savedAccounts, logoutCurrent } = useAuthStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [modeToSwitch, setModeToSwitch] = useState<'offline' | 'online' | null>(null);

  const navItems = mode === 'online' ? ONLINE_NAV_ITEMS : OFFLINE_NAV_ITEMS;

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url;

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logoutCurrent();
  };

  const handleToggleMode = (newMode: 'offline' | 'online') => {
    if (mode === newMode) return;
    setModeToSwitch(newMode);
  };

  const confirmModeSwitch = () => {
    if (!modeToSwitch) return;
    setMode(modeToSwitch);
    window.location.reload();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose} 
        />
      )}
      <aside className={`fixed shadow   left-0 top-0 flex flex-col h-full py-6 bg-white rounded-3xl dark:shadow-none z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20 px-2' : 'w-64 px-4'}`}>
        <div className={`flex items-center mb-6 ${isCollapsed ? 'flex-col gap-4 mt-2' : 'justify-between px-2'}`}>
          <div className="flex items-center gap-3">
            <div className="min-w-10 w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-inter">Lzist</h2>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Stock Management</p>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="material-symbols-outlined text-xl">
                {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
              </span>
            </button>
          )}
        </div>

        {/* Mode Selector Pill in Sidebar */}
        {!isCollapsed ? (
          <div className="mx-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center gap-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleToggleMode('offline')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'offline'
                  ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">cloud_off</span>
              <span>Offline</span>
            </button>
            <button
              onClick={() => handleToggleMode('online')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'online'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-sm">cloud_done</span>
              <span>Online</span>
            </button>
          </div>
        ) : (
          <div className="mb-4 flex justify-center">
            <button
              onClick={() => handleToggleMode(mode === 'offline' ? 'online' : 'offline')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                mode === 'online'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={`Mode Aktif: ${mode === 'online' ? 'Online' : 'Offline'} (Klik untuk ganti)`}
            >
              <span className="material-symbols-outlined text-sm">
                {mode === 'online' ? 'cloud_done' : 'cloud_off'}
              </span>
            </button>
          </div>
        )}
        
        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex transition-all duration-200 ease-in-out font-inter ${
                  isCollapsed ? 'flex-col items-center justify-center py-2 px-1 rounded-xl text-center gap-1' : 'flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-sm'
                } ${
                  isActive
                    ? `bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold border-teal-400 ${isCollapsed ? '' : 'border-r-4'}`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium'
                }`
              }
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              {isCollapsed ? (
                <span className="text-[10px] leading-tight truncate w-full">{item.label}</span>
              ) : (
                <span>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">

          {isInstallable && (
            <button 
              onClick={handleInstallClick} 
              className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-medium border border-gray-200 dark:border-gray-700 ${isCollapsed ? 'flex-col px-1 text-[10px]' : 'text-sm mb-2'}`}
              title="Install App"
            >
              <span className="material-symbols-outlined text-sm">install_mobile</span>
              {!isCollapsed && <span>Install App</span>}
              {isCollapsed && <span className="text-center leading-tight">Install</span>}
            </button>
          )}

          {/* User Card / Mode Card */}
          {mode === 'online' ? (
            user ? (
              <div className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div
                  onClick={() => setIsAccountSwitcherOpen(true)}
                  className="flex items-center gap-2.5 grow overflow-hidden"
                  title="Kelola & Ganti Akun"
                >
                  <div className="relative min-w-9 w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0 overflow-hidden border border-teal-200">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-teal-600 text-base">person</span>
                    )}
                    {savedAccounts.length > 1 && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="grow overflow-hidden">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{userDisplayName}</p>
                        <span className="material-symbols-outlined text-xs text-gray-400 group-hover:text-teal-600 transition-colors">
                          expand_more
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer"
                    title="Keluar (Logout)"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2">
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">login</span>
                  {!isCollapsed && <span>Login Online</span>}
                </button>
              </div>
            )
          ) : (
            /* Offline Mode Card */
            <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <span className="material-symbols-outlined text-base">database</span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Mode Lokal (Dexie)</p>
                  <p className="text-[10px] text-gray-500 truncate">Semua data tersimpan offline</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Account Switcher Modal */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
      />

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setIsLogoutModalOpen(false)}
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
                onClick={() => setIsLogoutModalOpen(false)}
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

      {/* Mode Switch Confirmation */}
      <ConfirmDialog
        isOpen={modeToSwitch !== null}
        title={modeToSwitch === 'online' ? 'Pindah ke Mode Online?' : 'Pindah ke Mode Offline?'}
        message={
          modeToSwitch === 'online'
            ? 'Aplikasi akan beralih ke Mode Online (Cloud Supabase). Halaman akan di-refresh dan Anda perlu login untuk melanjutkan.'
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

export default SideNav;
