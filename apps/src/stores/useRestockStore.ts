import { create } from 'zustand';
import type { RestockList } from '../types';

interface RestockState {
  lists: RestockList[];
  activeListId: string | null;
  isLoading: boolean;
  setLists: (lists: RestockList[]) => void;
  setActiveList: (id: string | null) => void;
  addList: (list: RestockList) => void;
  updateList: (id: string, data: Partial<RestockList>) => void;
  removeList: (id: string) => void;
}

export const useRestockStore = create<RestockState>((set) => ({
  lists: [],
  activeListId: null,
  isLoading: false,
  setLists: (lists) => set({ lists }),
  setActiveList: (id) => set({ activeListId: id }),
  addList: (list) => set((s) => ({ lists: [...s.lists, list] })),
  updateList: (id, data) =>
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? { ...l, ...data } : l)),
    })),
  removeList: (id) =>
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),
}));
