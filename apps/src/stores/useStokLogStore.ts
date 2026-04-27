import { create } from 'zustand';
import type { StokLog } from '../types';

interface StokLogState {
  logs: StokLog[];
  isLoading: boolean;
  setLogs: (logs: StokLog[]) => void;
  addLog: (log: StokLog) => void;
}

export const useStokLogStore = create<StokLogState>((set) => ({
  logs: [],
  isLoading: false,
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((s) => ({ logs: [log, ...s.logs] })),
}));
