// store/common.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UIState {
  libraryViewMode: "grid" | "table";
  setLibraryViewMode: (libraryViewMode: "grid" | "table") => void;
  bookTheme: string;
  setBookTheme: (bookTheme: string) => void;
  bookCustomBackground: string;
  setBookCustomBackground: (bookCustomBackground: string) => void;
  bookCustomForeground: string;
  setBookCustomForeground: (bookCustomForeground: string) => void;
  bookCustomFontSize: number;
  setBookCustomFontSize: (bookCustomFontSize: number) => void;
  bookCustomFontFamily: string;
  setBookCustomFontFamily: (bookCustomFontFamily: string) => void;
  libraryPosition: number;
  setLibraryPosition: (libraryPosition: number) => void;
  libraryOfflinePosition: number;
  setLibraryOfflinePosition: (libraryOfflinePosition: number) => void;
  mangaDirection: "ltr" | "rtl";
  setMangaDirection: (mangaDirection: "ltr" | "rtl") => void;
  mangaViewMode: "single" | "double";
  setMangaViewMode: (mangaViewMode: "single" | "double") => void;
  mangaFitMode: "contain" | "actual";
  setMangaFitMode: (mangaFitMode: "contain" | "actual") => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      libraryViewMode: "grid",
      setLibraryViewMode: (libraryViewMode: "grid" | "table") =>
        set({ libraryViewMode }),
      bookTheme: "light",
      setBookTheme: (bookTheme: string) => set({ bookTheme }),
      bookCustomBackground: "#9FA172",
      setBookCustomBackground: (bookCustomBackground: string) =>
        set({ bookCustomBackground }),
      bookCustomForeground: "#ffffff",
      setBookCustomForeground: (bookCustomForeground: string) =>
        set({ bookCustomForeground }),
      bookCustomFontSize: 100,
      setBookCustomFontSize: (bookCustomFontSize: number) =>
        set({ bookCustomFontSize }),
      bookCustomFontFamily: "Lexend",
      setBookCustomFontFamily: (bookCustomFontFamily: string) =>
        set({ bookCustomFontFamily }),
      libraryPosition: 0,
      setLibraryPosition: (libraryPosition: number) => set({ libraryPosition }),
      libraryOfflinePosition: 0,
      setLibraryOfflinePosition: (libraryOfflinePosition: number) =>
        set({ libraryOfflinePosition }),
      mangaDirection: "ltr",
      setMangaDirection: (mangaDirection: "ltr" | "rtl") =>
        set({ mangaDirection }),
      mangaViewMode: "single",
      setMangaViewMode: (mangaViewMode: "single" | "double") =>
        set({ mangaViewMode }),
      mangaFitMode: "contain",
      setMangaFitMode: (mangaFitMode: "contain" | "actual") =>
        set({ mangaFitMode }),
      hasHydrated: false,
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
      partialize: (state) => ({
        libraryViewMode: state.libraryViewMode,
        bookTheme: state.bookTheme,
        bookCustomBackground: state.bookCustomBackground,
        bookCustomForeground: state.bookCustomForeground,
        bookCustomFontSize: state.bookCustomFontSize,
        bookCustomFontFamily: state.bookCustomFontFamily,
        libraryPosition: state.libraryPosition,
        libraryOfflinePosition: state.libraryOfflinePosition,
        mangaDirection: state.mangaDirection,
        mangaViewMode: state.mangaViewMode,
        mangaFitMode: state.mangaFitMode,
      }),
    }
  )
);
