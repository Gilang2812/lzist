import { create } from 'zustand';
import { supabase } from '../db/supabase';
import { SyncEngine } from '../db/syncEngine';
import { ROUTES } from '../routes';
import type { User, Session, AuthError } from '@supabase/supabase-js';

const STORAGE_KEY = 'lzist_saved_accounts';

export interface SavedAccount {
  id: string; // user.id
  email: string;
  fullName: string;
  avatarUrl?: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };
  lastActiveAt: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  savedAccounts: SavedAccount[];
  loading: boolean;
  isSwitching: boolean;
  initialized: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  registerWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; data?: any }>;
  loginWithGoogle: () => Promise<{ error: AuthError | null }>;
  switchAccount: (accountId: string) => Promise<{ error: AuthError | Error | null }>;
  removeSavedAccount: (accountId: string) => Promise<void>;
  logoutCurrent: () => Promise<{ error: AuthError | null }>;
  logoutAll: () => Promise<{ error: AuthError | null }>;
  logout: () => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

// Helper untuk membaca daftar akun tersimpan dari localStorage
function loadSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Gagal membaca saved accounts dari localStorage:', e);
    return [];
  }
}

// Helper untuk menyimpan daftar akun ke localStorage
function persistSavedAccounts(accounts: SavedAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Gagal menyimpan saved accounts ke localStorage:', e);
  }
}

// Helper untuk menambah / memperbarui sesi akun
function upsertAccountInList(accounts: SavedAccount[], session: Session): SavedAccount[] {
  if (!session?.user) return accounts;

  const user = session.user;
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const newAccount: SavedAccount = {
    id: user.id,
    email: user.email || '',
    fullName,
    avatarUrl,
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    },
    lastActiveAt: Date.now(),
  };

  const filtered = accounts.filter((acc) => acc.id !== user.id);
  const updated = [newAccount, ...filtered];
  persistSavedAccounts(updated);
  return updated;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  savedAccounts: loadSavedAccounts(),
  loading: true,
  isSwitching: false,
  initialized: false,
  error: null,

  initAuth: async () => {
    try {
      set({ loading: true });
      let currentSaved = loadSavedAccounts();

      // Dapatkan session aktif dari supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.warn('Error fetching initial auth session:', error.message);
      }

      if (session?.user) {
        currentSaved = upsertAccountInList(currentSaved, session);
      }

      set({
        session,
        user: session?.user ?? null,
        savedAccounts: currentSaved,
        loading: false,
        initialized: true,
      });

        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user) {
            const updated = upsertAccountInList(get().savedAccounts, newSession);
            set({
              session: newSession,
              user: newSession.user,
              savedAccounts: updated,
              loading: false,
            });
            // Upsert user record into Supabase 'users' table if not exists
            const { error: upsertError } = await supabase.from('users').upsert({
              user_id: newSession.user.id,
              username: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'User',
              email: newSession.user.email,
            });
            if (upsertError) {
              console.error('Failed to upsert user record:', upsertError);
            }
          } else {
            set({
              session: null,
              user: null,
              loading: false,
            });
          }
        });
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      set({
        loading: false,
        initialized: true,
        error: err?.message || 'Gagal inisialisasi sesi',
      });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error };
    }

    let updatedSaved = get().savedAccounts;
    if (data.session) {
      updatedSaved = upsertAccountInList(updatedSaved, data.session);
    }

    set({
      user: data.user,
      session: data.session,
      savedAccounts: updatedSaved,
      loading: false,
      error: null,
    });

    return { error: null };
  },

  registerWithEmail: async (email: string, password: string, fullName?: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error };
    }

    let updatedSaved = get().savedAccounts;
    if (data.session) {
      updatedSaved = upsertAccountInList(updatedSaved, data.session);
    }

    set({
      user: data.user,
      session: data.session,
      savedAccounts: updatedSaved,
      loading: false,
      error: null,
    });

    return { error: null, data };
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + ROUTES.DASHBOARD,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return { error };
    }

    return { error: null };
  },

  switchAccount: async (accountId: string) => {
    const targetAccount = get().savedAccounts.find((acc) => acc.id === accountId);
    if (!targetAccount) {
      const err = new Error('Akun tidak ditemukan di daftar tersimpan.');
      set({ error: err.message });
      return { error: err };
    }

    // Jika sudah akun aktif, tidak perlu switch
    if (get().user?.id === accountId) {
      return { error: null };
    }

    set({ isSwitching: true, error: null });

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: targetAccount.session.access_token,
        refresh_token: targetAccount.session.refresh_token,
      });

      if (error) {
        console.error('Gagal beralih akun:', error.message);
        set({
          isSwitching: false,
          error: `Sesi akun ${targetAccount.email} sudah kedaluwarsa atau tidak valid. Silakan login kembali.`,
        });
        return { error };
      }

      let updatedSaved = get().savedAccounts;
      if (data.session) {
        updatedSaved = upsertAccountInList(updatedSaved, data.session);
      }

      set({
        user: data.user,
        session: data.session,
        savedAccounts: updatedSaved,
        isSwitching: false,
        error: null,
      });

      // Trigger sinkronisasi data baru untuk akun yang baru aktif
      try {
        SyncEngine.pull();
      } catch (e) {
        console.warn('SyncEngine pull error after switch:', e);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Switch account exception:', err);
      set({
        isSwitching: false,
        error: err?.message || 'Terjadi kesalahan saat beralih akun',
      });
      return { error: err };
    }
  },

  removeSavedAccount: async (accountId: string) => {
    const isCurrent = get().user?.id === accountId;
    const remaining = get().savedAccounts.filter((acc) => acc.id !== accountId);
    persistSavedAccounts(remaining);
    set({ savedAccounts: remaining });

    if (isCurrent) {
      if (remaining.length > 0) {
        // Otomatis beralih ke akun pertama yang tersisa
        await get().switchAccount(remaining[0].id);
      } else {
        // Tidak ada akun lain, logout total
        await get().logout();
      }
    }
  },

  logoutCurrent: async () => {
    const currentId = get().user?.id;
    if (currentId) {
      await get().removeSavedAccount(currentId);
      return { error: null };
    }
    return get().logout();
  },

  logoutAll: async () => {
    set({ loading: true, error: null });
    persistSavedAccounts([]);
    const { error } = await supabase.auth.signOut();

    set({
      user: null,
      session: null,
      savedAccounts: [],
      loading: false,
      error: error?.message ?? null,
    });

    return { error: error ?? null };
  },

  logout: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ loading: false, error: error.message });
      return { error };
    }

    set({
      user: null,
      session: null,
      loading: false,
      error: null,
    });

    return { error: null };
  },

  clearError: () => set({ error: null }),
}));
