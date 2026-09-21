import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore, type SavedAccount } from '../stores/useAuthStore';
import { useAppModeStore } from '../stores/useAppModeStore';
import { ROUTES } from '../routes';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    savedAccounts,
    loginWithEmail,
    loginWithGoogle,
    switchAccount,
    removeSavedAccount,
    loading,
    error,
    clearError,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);
  const [showAccountChooser, setShowAccountChooser] = useState(savedAccounts.length > 0);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync state if saved accounts change
  useEffect(() => {
    if (savedAccounts.length === 0) {
      setShowAccountChooser(false);
    }
  }, [savedAccounts.length]);

  // Redirect if user is already logged in
  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Harap isi email dan password.');
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await loginWithEmail(email.trim(), password);
    setIsSubmitting(false);

    if (authError) {
      if (authError.message.toLowerCase().includes('invalid login credentials')) {
        setLocalError('Email atau password yang Anda masukkan salah.');
      } else if (authError.message.toLowerCase().includes('email not confirmed')) {
        setLocalError('Email Anda belum dikonfirmasi. Silakan periksa inbox/spam email Anda.');
      } else {
        setLocalError(authError.message);
      }
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsGoogleSubmitting(true);
    const { error: authError } = await loginWithGoogle();
    setIsGoogleSubmitting(false);

    if (authError) {
      setLocalError(`Gagal login dengan Google: ${authError.message}`);
    }
  };

  const handleSelectAccount = async (acc: SavedAccount) => {
    setLocalError(null);
    setSwitchingAccountId(acc.id);
    const { error: switchErr } = await switchAccount(acc.id);
    setSwitchingAccountId(null);

    if (switchErr) {
      setLocalError(switchErr.message);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleRemoveAccount = async (accId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeSavedAccount(accId);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Decorative Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-300/30 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-dm text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/30 mb-4 animate-in fade-in zoom-in duration-300">
          <span className="material-symbols-outlined text-3xl">inventory_2</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          {showAccountChooser ? 'Pilih Akun Tersimpan' : 'Masuk ke Lzist'}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant font-medium">
          {showAccountChooser
            ? 'Masuk cepat dengan akun yang pernah digunakan'
            : 'Sistem Manajemen Stok & Inventaris Toko'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-dm">
        <div className="bg-surface-container-lowest py-8 px-6 shadow-xl shadow-surface-variant/20 rounded-2xl sm:px-10 border border-outline-variant/30">
          {/* Error Alert */}
          {(localError || error) && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-base text-red-500 shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-snug">{localError || error}</span>
            </div>
          )}

          {showAccountChooser && savedAccounts.length > 0 ? (
            /* Saved Accounts Chooser View */
            <div className="space-y-3">
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {savedAccounts.map((acc) => {
                  const isSelecting = switchingAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => !isSelecting && handleSelectAccount(acc)}
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/40 hover:border-teal-400 bg-surface-container-low hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0 overflow-hidden border border-teal-200">
                          {acc.avatarUrl ? (
                            <img src={acc.avatarUrl} alt={acc.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-teal-600">person</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate group-hover:text-teal-700 dark:group-hover:text-teal-300">
                            {acc.fullName}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">{acc.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isSelecting ? (
                          <span className="material-symbols-outlined text-teal-600 animate-spin text-xl">
                            progress_activity
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveAccount(acc.id, e)}
                              className="p-1.5 text-on-surface-variant/40 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Hapus akun dari daftar"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                            <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-teal-600 transition-colors text-lg">
                              chevron_right
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-outline-variant/30 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowAccountChooser(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant/60 rounded-xl bg-white dark:bg-zinc-900 text-on-surface hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Gunakan Akun Lain</span>
                </button>
              </div>
            </div>
          ) : (
            /* Traditional Form View */
            <>
              {/* Google OAuth Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleSubmitting || isSubmitting || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-outline-variant/60 rounded-xl shadow-xs bg-white text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-semibold text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleSubmitting ? (
                  <span className="material-symbols-outlined text-base animate-spin text-teal-600">
                    progress_activity
                  </span>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isGoogleSubmitting ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface-container-lowest px-3 text-on-surface-variant font-medium">
                    atau masuk dengan email
                  </span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@lzist.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 text-sm bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting || loading}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">
                          progress_activity
                        </span>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">login</span>
                        <span>Masuk</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Toggle to account chooser if saved accounts exist */}
              {savedAccounts.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAccountChooser(true)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold hover:underline cursor-pointer"
                  >
                    Kembali ke daftar akun tersimpan ({savedAccounts.length})
                  </button>
                </div>
              )}

              {/* Register Redirection Link */}
              <div className="mt-6 text-center text-sm text-on-surface-variant">
                Belum memiliki akun?{' '}
                <Link
                  to={ROUTES.REGISTER}
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  Daftar sekarang
                </Link>
              </div>

              {/* Mode Offline Option */}
              <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
                <button
                  type="button"
                  onClick={() => {
                    useAppModeStore.getState().setMode('offline');
                    navigate(ROUTES.DASHBOARD);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-gray-600 hover:text-teal-700 bg-gray-100 hover:bg-teal-50 rounded-xl transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">cloud_off</span>
                  <span>Gunakan Mode Offline (Data Tersimpan Lokal)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
