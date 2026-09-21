import { create } from 'zustand';

export type AppMode = 'offline' | 'online';

interface AppModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const STORAGE_KEY = 'lzist_app_mode';

export const useAppModeStore = create<AppModeState>((set, get) => ({
  mode: (localStorage.getItem(STORAGE_KEY) as AppMode) || 'offline',

  setMode: (mode: AppMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },

  toggleMode: () => {
    const nextMode: AppMode = get().mode === 'offline' ? 'online' : 'offline';
    localStorage.setItem(STORAGE_KEY, nextMode);
    set({ mode: nextMode });
  },
}));
