import { create } from 'zustand';
import type { Barang } from '../types';

interface BarangState {
  items: Barang[];
  isLoading: boolean;
  setItems: (items: Barang[]) => void;
  addItem: (item: Barang) => void;
  updateItem: (id: string, data: Partial<Barang>) => void;
  removeItem: (id: string) => void;
}

export const useBarangStore = create<BarangState>((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, data) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));
