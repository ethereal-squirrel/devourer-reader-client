// store/common.ts
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

export interface LogState {
  logs: any[];
  setLogs: (logs: any[]) => void;
  addLog: (log: any) => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useLogStore = create<LogState>()(
  persist(
    (set) => ({
      logs: [],
      setLogs: (logs: any[]) => set({ logs }),
      addLog: (log: any) => set((state) => ({ logs: [...state.logs, log] })),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "log-storage",
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
      partialize: (state) => ({
        logs: state.logs,
      }),
    }
  )
);
