// src/lib/store.ts (Zustand para estado global)
import { create } from "zustand";

type AppStore = {
  storeId: string | null;
  setStoreId: (id: string) => void;
};

export const useStore = create<AppStore>((set) => ({
  storeId: null,
  setStoreId: (id) => set({ storeId: id }),
}));