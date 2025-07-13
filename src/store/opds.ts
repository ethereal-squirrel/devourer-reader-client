import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

import { db } from "../lib/database";

export interface OpdsState {
  opdsUrl: string | null;
  opdsLibraries: null | any[];
  opdsBooks: null | any[];
  opdsLibraryUrl: string | null;
  opdsLimit: number;
  opdsPage: number;
  nextLink: string | null;
  prevLink: string | null;
  setOpdsUrl: (opdsUrl: string | null) => void;
  setOpdsLibraries: (opdsLibraries: any[] | null) => void;
  setOpdsBooks: (opdsBooks: any[] | null) => void;
  setOpdsLibraryUrl: (opdsLibraryUrl: string | null) => void;
  setOpdsLimit: (opdsLimit: number) => void;
  setOpdsPage: (opdsPage: number) => void;
  setNextLink: (nextLink: string | null) => void;
  setPrevLink: (prevLink: string | null) => void;
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
  handler: StateCreator<T>;
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

export const useOpdsStore = createSQLiteStore({
  name: "devourer/opds",
  handler: (set: any) => ({
    opdsUrl: null,
    opdsLibraries: null,
    opdsBooks: null,
    opdsLibraryUrl: null,
    opdsLimit: 50,
    opdsPage: 1,
    nextLink: null,
    prevLink: null,
    setOpdsUrl: (opdsUrl: string | null) => set({ opdsUrl }),
    setOpdsLibraries: (opdsLibraries: any[] | null) => set({ opdsLibraries }),
    setOpdsBooks: (opdsBooks: any[] | null) => set({ opdsBooks }),
    setOpdsLibraryUrl: (opdsLibraryUrl: string | null) =>
      set({ opdsLibraryUrl }),
    setOpdsLimit: (opdsLimit: number) => set({ opdsLimit }),
    setOpdsPage: (opdsPage: number) => set({ opdsPage }),
    setNextLink: (nextLink: string | null) => set({ nextLink }),
    setPrevLink: (prevLink: string | null) => set({ prevLink }),
  }),
});
