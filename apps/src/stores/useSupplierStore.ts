import { create } from 'zustand';
import type { Supplier } from '../types';

interface SupplierState {
  items: Supplier[];
  isLoading: boolean;
  setItems: (items: Supplier[]) => void;
  addItem: (item: Supplier) => void;
  updateItem: (id: string, data: Partial<Supplier>) => void;
  removeItem: (id: string) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
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
