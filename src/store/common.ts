// store/common.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CommonState {
  activeTab: string;
  setActiveTab: (activeTab: string) => void;
  server: string;
  setServer: (server: string) => void;
  serverUsername: string;
  setServerUsername: (serverUsername: string) => void;
  serverPassword: string;
  setServerPassword: (serverPassword: string) => void;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
  config: any;
  setConfig: (config: any) => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useCommonStore = create<CommonState>()(
  persist(
    (set) => ({
      activeTab: "/",
      setActiveTab: (activeTab: string) => set({ activeTab }),
      server: "",
      setServer: (server: string) => set({ server }),
      serverUsername: "",
      setServerUsername: (serverUsername: string) => set({ serverUsername }),
      serverPassword: "",
      setServerPassword: (serverPassword: string) => set({ serverPassword }),
      isConnected: false,
      setIsConnected: (isConnected: boolean) => set({ isConnected }),
      config: {},
      setConfig: (config: any) => set({ config }),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "common-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
      partialize: (state) => ({
        server: state.server,
        serverUsername: state.serverUsername,
        serverPassword: state.serverPassword,
        isConnected: state.isConnected,
        config: state.config,
      }),
    }
  )
);
