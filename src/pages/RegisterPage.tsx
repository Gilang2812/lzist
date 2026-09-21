import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppModeStore } from '../stores/useAppModeStore';
import { ROUTES } from '../routes';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, registerWithEmail, loginWithGoogle, loading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isRegisteredSuccess) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [user, navigate, isRegisteredSuccess]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError('Harap lengkapi semua kolom.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Konfirmasi password tidak cocok dengan password.');
      return;
    }

    setIsSubmitting(true);
    const { error: authError, data } = await registerWithEmail(
      email.trim(),
      password,
      fullName.trim()
    );
    setIsSubmitting(false);

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered')) {
        setLocalError('Email ini sudah terdaftar. Silakan langsung login.');
      } else {
        setLocalError(authError.message);
      }
    } else {
      // Check if session was returned immediately (auto-login) or if email confirmation is required
      if (data?.session) {
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        setIsRegisteredSuccess(true);
      }
    }
  };

  const handleGoogleRegister = async () => {
    setLocalError(null);
    setIsGoogleSubmitting(true);
    const { error: authError } = await loginWithGoogle();
    setIsGoogleSubmitting(false);

    if (authError) {
      setLocalError(`Gagal daftar dengan Google: ${authError.message}`);
    }
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
          Daftar Akun Baru
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant font-medium">
          Mulai kelola inventaris & pesanan dengan Lzist
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-dm">
        <div className="bg-surface-container-lowest py-8 px-6 shadow-xl shadow-surface-variant/20 rounded-2xl sm:px-10 border border-outline-variant/30">
          {/* Success State Alert */}
          {isRegisteredSuccess ? (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Pendaftaran Berhasil!</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Akun untuk <strong className="text-teal-700">{email}</strong> telah berhasil dibuat. Silakan periksa inbox/spam email Anda untuk konfirmasi (jika diperlukan) atau langsung login.
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Menuju Halaman Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {(localError || error) && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-base text-red-500 shrink-0 mt-0.5">
                    error
                  </span>
                  <span className="leading-snug">{localError || error}</span>
                </div>
              )}

              {/* Google OAuth Register Button */}
              <button
                type="button"
                onClick={handleGoogleRegister}
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
                <span>{isGoogleSubmitting ? 'Menghubungkan...' : 'Daftar dengan Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface-container-lowest px-3 text-on-surface-variant font-medium">
                    atau daftar dengan email
                  </span>
                </div>
              </div>

              {/* Register Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                  >
                    Nama Lengkap
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-lg">person</span>
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Anda / Toko"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

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
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                  >
                    Password (Min. 6 Karakter)
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
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

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5"
                  >
                    Konfirmasi Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-lg">lock_reset</span>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
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
                        <span>Mendaftarkan...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span>Daftar Akun</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Login Redirection Link */}
              <div className="mt-6 text-center text-sm text-on-surface-variant">
                Sudah memiliki akun?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  Masuk di sini
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

export default RegisterPage;
