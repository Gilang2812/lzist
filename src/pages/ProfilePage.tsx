// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, type SavedAccount } from '../stores/useAuthStore';
import { supabase } from '../db/supabase';
import AddAccountModal from '../components/auth/AddAccountModal';
import { ROUTES } from '../routes';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    savedAccounts,
    switchAccount,
    removeSavedAccount,
    logoutCurrent,
    logoutAll,
    error,
    initAuth,
  } = useAuthStore();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userDisplayName = user?.user_metadata?.full_name || '';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const incompleteProfileFields = [
    !userDisplayName && 'Nama lengkap',
    !userAvatar && 'Foto profil',
  ].filter((field): field is string => Boolean(field));

  // Update full name (stored in user_metadata.full_name)
  const handleNameUpdate = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (!fullName.trim()) {
      setLocalError('Nama tidak boleh kosong');
      return;
    }
    setIsUpdatingName(true);
    const { error: updError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });
    setIsUpdatingName(false);
    if (updError) {
      setLocalError(updError.message);
    } else {
      setSuccessMessage('Nama berhasil diperbarui');
      // Refresh auth state to get updated metadata
      await initAuth();
    }
  };

  const handleSwitch = async (acc: SavedAccount) => {
    await switchAccount(acc.id);
    navigate(0);
  };

  const handleRemove = async (accId: string) => {
    await removeSavedAccount(accId);
    navigate(0);
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Profil Akun</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Kelola informasi dan sesi akun Lzist Anda.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Tambah Akun
          </button>
        </div>

        {(localError || error) && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {localError || error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900">
              {userAvatar ? (
                <img src={userAvatar} alt={userDisplayName || 'Foto profil'} className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl">person</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Informasi Profil</p>
              <h3 className="mt-1 truncate text-xl font-bold text-on-surface">{userDisplayName || 'Nama belum diisi'}</h3>
              <p className="mt-1 truncate text-sm text-on-surface-variant">{userEmail || 'Email belum tersedia'}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs text-on-surface-variant">Nama lengkap</p>
              <p className="mt-1 font-semibold text-on-surface">{userDisplayName || 'Belum diisi'}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs text-on-surface-variant">Email</p>
              <p className="mt-1 break-all font-semibold text-on-surface">{userEmail || 'Belum tersedia'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600">checklist</span>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">Profil yang belum lengkap</h3>
              {incompleteProfileFields.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-300">
                  {incompleteProfileFields.map((field) => (
                    <li key={field} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">radio_button_unchecked</span>
                      {field}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">Semua informasi profil utama sudah terisi.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-on-surface">Edit Profil</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Perbarui nama yang ditampilkan di aplikasi.</p>
          </div>
          <div className="max-w-dm">
            <label className="mb-1 block text-sm font-medium text-on-surface-variant">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low p-2.5 text-sm text-on-surface"
            />
            <button
              type="button"
              onClick={handleNameUpdate}
              disabled={isUpdatingName}
              className="mt-3 cursor-pointer rounded-xl bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isUpdatingName ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-on-surface">Keamanan Akun</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Ubah password Anda di halaman pengaturan keamanan.</p>
          </div>
          <Link
            to={ROUTES.PROFILE.PASSWORD}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
            Edit Password
          </Link>
        </section>

        {/* Saved accounts management */}
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-on-surface">Akun Tersimpan</h3>
              <p className="mt-1 text-sm text-on-surface-variant">Kelola akun lain yang tersimpan di perangkat ini.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Tambah Akun
            </button>
          </div>
          {savedAccounts.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Tidak ada akun tersimpan.</p>
          ) : (
            <ul className="space-y-2">
              {savedAccounts.map((acc) => (
                <li key={acc.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-3">
                    {acc.avatarUrl ? (
                      <img src={acc.avatarUrl} alt={acc.fullName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="material-symbols-outlined text-teal-600 text-2xl">person</span>
                    )}
                    <div>
                      <p className="font-medium text-on-surface">{acc.fullName}</p>
                      <p className="text-xs text-on-surface-variant">{acc.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {user?.id !== acc.id && (
                      <button
                        onClick={() => handleSwitch(acc)}
                        className="px-2 py-1 text-sm bg-teal-100 text-teal-800 rounded cursor-pointer"
                      >
                        Pilih
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(acc.id)}
                      className="p-1 text-on-surface-variant hover:text-red-600 cursor-pointer"
                      title="Hapus akun"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Logout actions */}
        <div className="flex flex-wrap gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl">
          <button
            onClick={logoutCurrent}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            Logout (Akun Ini)
          </button>
          <button
            onClick={handleLogoutAll}
            className="px-4 py-2 bg-red-800 text-white rounded-xl hover:bg-red-900 disabled:opacity-50 cursor-pointer"
          >
            Logout Semua Akun
          </button>
        </div>
        <div className="mt-6 text-center">
          <Link to={ROUTES.DASHBOARD} className="text-teal-600 hover:underline">
            &larr; Kembali ke Dashboard
          </Link>
        </div>

        <AddAccountModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          onSuccess={() => setSuccessMessage('Akun baru berhasil ditambahkan!')}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
