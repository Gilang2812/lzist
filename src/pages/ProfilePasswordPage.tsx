import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../db/supabase';
import Modal from '../components/ui/Modal';
import { ROUTES } from '../routes';

const ProfilePasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [confirmPwdError, setConfirmPwdError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setConfirmPwdError(null);

    if (newPassword.length < 6) {
      setLocalError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPwdError('Konfirmasi password tidak cocok');
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      setLocalError(error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <div className="mr-auto w-full max-w-gl">
        <Link
          to={ROUTES.PROFILE.INDEX}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-900"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Kembali ke Profil
        </Link>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 border sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
              <span className="material-symbols-outlined">lock_reset</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Edit Password</h1>
              <p className="mt-1 text-sm text-on-surface-variant">Perbarui password akun Anda untuk menjaga keamanan sesi.</p>
            </div>
          </div>

          {localError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {localError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface-variant">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setConfirmPwdError(null);
                }}
                className="block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low p-2.5 text-sm text-on-surface transition-colors focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface-variant">Konfirmasi Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setConfirmPwdError(null);
                }}
                className="block w-full rounded-xl border border-outline-variant/50 bg-surface-container-low p-2.5 text-sm text-on-surface transition-colors focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                required
                minLength={6}
              />
              {confirmPwdError && <p className="mt-1 text-sm text-red-600">{confirmPwdError}</p>}
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
            >
              {isChangingPassword && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
              {isChangingPassword ? 'Mengubah...' : 'Simpan Password'}
            </button>
          </form>
        </section>

        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Berhasil"
        >
          <p className="text-on-surface">Password telah berhasil diubah.</p>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePasswordPage;
