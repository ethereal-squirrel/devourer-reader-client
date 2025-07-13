// store/library.ts
import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

import { Book } from "../hooks/useBook";
import { Library } from "../hooks/useLibrary";
import { File, Series } from "../hooks/useManga";
import { db } from "../lib/database";

export interface LibraryState {
  libraryId: number | null;
  libraryName: string | null;
  libraryPath: string | null;
  librariesData: null | Library[];
  libraryData: null | Library;
  filesData: null | File[];
  fileData: null | File;
  currentSeries: null | Series;
  currentBook: null | Book;
  recentlyRead: any;
  setLibraryId: (libraryId: number | null) => void;
  setLibraryName: (libraryName: string | null) => void;
  setLibraryPath: (libraryPath: string | null) => void;
  setLibrariesData: (librariesData: Library[] | null) => void;
  setLibraryData: (libraryData: Library | null) => void;
  setFilesData: (filesData: File[] | null) => void;
  setFileData: (fileData: File | null) => void;
  setCurrentSeries: (currentSeries: Series | null) => void;
  setCurrentBook: (currentBook: Book | null) => void;
  setRecentlyRead: (recentlyRead: any) => void;
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

export const sqliteStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    await db.connect();
    const result = (await db.select(
      "SELECT * FROM zustand WHERE key = ? LIMIT 1",
      [name]
    )) as any[];

    if (result && result.length > 0) {
      return result[0].value;
    } else {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await db.connect();
    await db.execute("DELETE FROM zustand WHERE key = ?", [name]);
    await db.execute("INSERT INTO zustand (key, value) VALUES (?, ?)", [
      name,
      value,
    ]);
  },
  removeItem: async (name: string): Promise<void> => {
    await db.connect();
    await db.execute("DELETE FROM zustand WHERE key = ?", [name]);
  },
};

export const createSQLiteStore = <T extends object>({
  name,
  handler,
}: {
  name: string;
  handler: StateCreator<T, [], [], T>;
}) => {
  if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile") {
    return create<T>()(
      persist(handler, {
        name,
        storage: createJSONStorage(() => sqliteStorage),
      })
    );
  }

  return create<T>()(
    persist(handler, {
      name,
      storage: createJSONStorage(() => indexedDBStorage),
    })
  );
};

export const useLibraryStore = createSQLiteStore({
  name: "devourer/library",
  handler: (set: any) => ({
    libraryId: null,
    libraryName: null,
    libraryPath: null,
    librariesData: null,
    libraryData: null,
    filesData: null,
    fileData: null,
    currentSeries: null,
    currentBook: null,
    recentlyRead: null,
    setLibraryId: (libraryId: number | null) => set({ libraryId }),
    setLibraryName: (libraryName: string | null) => set({ libraryName }),
    setLibraryPath: (libraryPath: string | null) => set({ libraryPath }),
    setLibrariesData: (librariesData: Library[] | null) =>
      set({ librariesData }),
    setLibraryData: (libraryData: Library | null) => set({ libraryData }),
    setFilesData: (filesData: File[] | null) => set({ filesData }),
    setFileData: (fileData: File | null) => set({ fileData }),
    setCurrentSeries: (currentSeries: Series | null) => set({ currentSeries }),
    setCurrentBook: (currentBook: Book | null) => set({ currentBook }),
    setRecentlyRead: (recentlyRead: any) => set({ recentlyRead }),
  }),
});
