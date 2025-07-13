// store/common.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthState {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  displayAuthModal: boolean;
  setDisplayAuthModal: (displayAuthModal: boolean) => void;
  oauthGoogleAccessToken: string;
  setOauthGoogleAccessToken: (oauthGoogleAccessToken: string) => void;
  oauthGoogleRefreshToken: string;
  setOauthGoogleRefreshToken: (oauthGoogleRefreshToken: string) => void;
  oauthDropboxAccessToken: string;
  setOauthDropboxAccessToken: (oauthDropboxAccessToken: string) => void;
  oauthDropboxRefreshToken: string;
  setOauthDropboxRefreshToken: (oauthDropboxRefreshToken: string) => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey: string) => set({ apiKey }),
      username: "",
      setUsername: (username: string) => set({ username }),
      password: "",
      setPassword: (password: string) => set({ password }),
      displayAuthModal: false,
      setDisplayAuthModal: (displayAuthModal: boolean) =>
        set({ displayAuthModal }),
      oauthGoogleAccessToken: "",
      setOauthGoogleAccessToken: (oauthGoogleAccessToken: string) =>
        set({ oauthGoogleAccessToken }),
      oauthGoogleRefreshToken: "",
      setOauthGoogleRefreshToken: (oauthGoogleRefreshToken: string) =>
        set({ oauthGoogleRefreshToken }),
      oauthDropboxAccessToken: "",
      setOauthDropboxAccessToken: (oauthDropboxAccessToken: string) =>
        set({ oauthDropboxAccessToken }),
      oauthDropboxRefreshToken: "",
      setOauthDropboxRefreshToken: (oauthDropboxRefreshToken: string) =>
        set({ oauthDropboxRefreshToken }),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
      partialize: (state) => ({
        apiKey: state.apiKey,
        oauthGoogleAccessToken: state.oauthGoogleAccessToken,
        oauthGoogleRefreshToken: state.oauthGoogleRefreshToken,
        oauthDropboxAccessToken: state.oauthDropboxAccessToken,
        oauthDropboxRefreshToken: state.oauthDropboxRefreshToken,
      }),
    }
  )
);
