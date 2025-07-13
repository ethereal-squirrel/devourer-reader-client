import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ImportState {
  currentQueue: any[];
  setCurrentQueue: (currentQueue: any[]) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useImportStore = create<ImportState>()(
  persist(
    (set) => ({
      currentQueue: [],
      setCurrentQueue: (currentQueue: any[]) => set({ currentQueue }),
      processing: false,
      setProcessing: (processing: boolean) => set({ processing }),
      hasHydrated: false,
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
    }),
    {
      name: "import-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
      partialize: (state) => ({
        currentQueue: state.currentQueue,
        processing: state.processing,
      }),
    }
  )
);
