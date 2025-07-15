import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";

import { Book } from "./useBook";
import { Series } from "./useManga";
import { useRequest } from "./useRequest";
import { db } from "../lib/database";
import { useCommonStore } from "../store/common";
import { useLibraryStore } from "../store/library";
import { appLocalDataDir, join } from "@tauri-apps/api/path";

export interface Library {
  id: number;
  name: string;
  path?: string;
  type: "book" | "manga";
  metadata?: {
    provider?:
      | "myanimelist"
      | "googlebooks"
      | "devourer"
      | "comicvine"
      | "openlibrary"
      | "metron";
    apiKey?: string;
  };
  series: Array<Book | Series>;
  collections?: Array<{
    id: number;
    name: string;
    series: number[];
  }>;
  seriesCount?: number;
}

export function useLibrary() {
  const { makeRequest } = useRequest();
  const { setIsConnected } = useCommonStore(
    useShallow((state) => ({
      setIsConnected: state.setIsConnected,
    }))
  );
  const [scanStatus, setScanStatus] = useState<any>(null);
  const {
    setLibrariesData,
    setLibraryId,
    libraryId,
    setLibraryData,
    setRecentlyRead,
  } = useLibraryStore(
    useShallow((state) => ({
      setLibrariesData: state.setLibrariesData,
      setLibraryId: state.setLibraryId,
      libraryId: state.libraryId,
      setLibraryData: state.setLibraryData,
      setRecentlyRead: state.setRecentlyRead,
    }))
  );

  const navigate = useNavigate();

  const openLocalFile = async () => {
    const file = await open({
      multiple: false,
      directory: false,
    });

    if (!file) {
      return;
    }

    const fileExtension = file.split(".").pop()?.toLowerCase();

    if (!fileExtension) {
      toast.error("Unsupported file type", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });
    }

    const localDataDir = await appLocalDataDir();

    let pathToFile: string | null = null;

    if (["epub", "pdf"].includes(fileExtension as string)) {
      pathToFile = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        `local.${fileExtension}`
      );

      await copyFile(file, pathToFile, {
        toPathBaseDir: BaseDirectory.AppLocalData,
      });

      const url = `/book/0/read?opdsType=${
        fileExtension === "pdf" ? "opds-pdf" : "opds-epub"
      }&opdsUrl=local:${pathToFile}`;

      navigate(url);
    } else if (["cbz", "zip", "cbr", "rar"].includes(fileExtension as string)) {
      pathToFile = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        `local.${fileExtension}`
      );

      await copyFile(file, pathToFile, {
        toPathBaseDir: BaseDirectory.AppLocalData,
      });

      const url = `/manga/0/read?directOpen=true&directFile=${pathToFile}`;

      navigate(url);
    } else {
      toast.error("Unsupported file type", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });

      return;
    }
  };

  const retrieveLibraries = async (host?: string) => {
    const response = await makeRequest(
      "/libraries",
      "GET",
      undefined,
      false,
      host
    );

    if (!response.status) {
      setIsConnected(false);
      throw new Error("Failed to fetch libraries");
    }

    setIsConnected(true);
    setLibrariesData(response.libraries as Library[]);

    const recentlyRead = await getRecentlyRead();
    setRecentlyRead(recentlyRead);

    return true;
  };

  const importLibrary = async (library: any) => {
    console.log(library);
    console.log("/migrate/calibre", "POST", {
      calibrePath: library.path,
      libraryName: library.name,
      libraryMetadataProvider: library.metadata.provider,
    });
    const response = await makeRequest(
      "/migrate/calibre",
      "POST",
      {
        calibrePath: library.path,
        libraryName: library.name,
        libraryMetadataProvider: library.metadata.provider,
      },
      false
    );

    if (!response.status) {
      toast.error(
        "Failed to import library. Please check your Calibre path and try again.",
        {
          position: "bottom-right",
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
        }
      );
      return false;
    } else {
      toast.success(
        "Library imported successfully, give it a minute to start scanning then refresh using the icon at the top right.",
        {
          position: "bottom-right",
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
        }
      );
      return true;
    }
  };

  const retrieveLibrary = async (libraryId: number) => {
    const response = await makeRequest(
      `/library/${libraryId}`,
      "GET",
      undefined,
      false
    );

    if (!response.status) {
      setIsConnected(false);
      setLibraryId(null);
      setLibrary(null);
      toast.error("Failed to fetch library", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });

      throw new Error("Failed to fetch library");
    }

    setLibraryId(libraryId);
    setLibraryData(response.library as Library);

    return true;
  };

  const getScanStatus = async (libraryId: number) => {
    const response = await makeRequest(
      `/library/${libraryId}/scan`,
      "GET",
      undefined,
      false
    );

    if (!response.status) {
      throw new Error("Failed to fetch scan status");
    }

    setScanStatus(response);

    return true;
  };

  const addToCollection = async (collectionId: number, entityId: number) => {
    const response = await makeRequest(
      `/collections/${collectionId}/${entityId}`,
      "PATCH"
    );

    if (!response.status) {
      throw new Error("Failed to add to collection");
    }

    return true;
  };

  const removeFromCollection = async (
    collectionId: number,
    entityId: number
  ) => {
    const response = await makeRequest(
      `/collections/${collectionId}/${entityId}`,
      "DELETE"
    );

    if (!response.status) {
      throw new Error("Failed to remove from collection");
    }

    return true;
  };

  const deleteCollection = async (collectionId: number) => {
    const response = await makeRequest(
      `/collections/${collectionId}`,
      "DELETE"
    );

    if (!response.status) {
      throw new Error("Failed to delete collection");
    }

    return true;
  };

  const scanLibrary = async (libraryId: number) => {
    const response = await makeRequest(`/library/${libraryId}/scan`, "POST");

    if (response.status) {
      toast.success("Scan started.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
          zIndex: 1000,
        },
      });
    } else {
      toast.error(
        "Scan failed. If a scan is still in progress, this is likely the reason.",
        {
          position: "bottom-right",
          style: {
            backgroundColor: "#111827",
            color: "#fff",
            zIndex: 1000,
          },
        }
      );
    }

    return response;
  };

  const getRecentlyRead = async () => {
    const response = await makeRequest("/recently-read", "GET");

    if (!response.status) {
      throw new Error("Failed to fetch recently read");
    }

    return response.recentlyRead;
  };

  const createLibrary = async (library: {
    name: string;
    path: string;
  }): Promise<Library> => {
    const response = await makeRequest("/libraries", "POST", library);

    if (!response.status) {
      throw new Error("Failed to create library");
    } else {
      setLibraryId(response.library.id);
      toast.success(
        "Library created successfully, give it a minute to start scanning then refresh using the icon at the top right.",
        {
          position: "bottom-right",
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
        }
      );
      return response.library;
    }
  };

  const updateLibrary = async (
    libraryId: number,
    payload: any
  ): Promise<Library> => {
    const response = await makeRequest(
      `/library/${libraryId}`,
      "PATCH",
      payload
    );

    if (!response.status) {
      throw new Error("Failed to update library");
    } else {
      toast.success("Library updated successfully.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });

      return response.library;
    }
  };

  const deleteLibrary = async (libraryId: number): Promise<boolean> => {
    const response = await makeRequest(`/library/${libraryId}`, "DELETE");

    if (!response.status) {
      throw new Error("Failed to delete library");
    } else {
      toast.success("Library deleted successfully.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });

      return true;
    }
  };

  const createCollection = async (payload: {
    title: string;
    libraryId: number;
  }): Promise<boolean> => {
    const response = await makeRequest(
      `/library/${payload.libraryId}/collections`,
      "POST",
      payload
    );

    if (!response.status) {
      throw new Error("Failed to create collection");
    } else {
      toast.success("Collection created successfully.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });

      return true;
    }
  };

  const refreshLibrary = async (): Promise<boolean> => {
    if (!libraryId) {
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
    await retrieveLibrary(libraryId as number);

    return true;
  };

  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoadingLocalLibrary, setIsLoadingLocalLibrary] = useState(false);
  const [localLibraryError, setLocalLibraryError] = useState<string | null>(
    null
  );

  const loadLocalBooks = async (): Promise<void> => {
    try {
      setIsLoadingLocalLibrary(true);
      setLocalLibraryError(null);

      const books = await db.select(
        "SELECT * FROM BookFile ORDER by title ASC"
      );

      setLibraryData({
        id: 9999,
        name: "Local Books",
        type: "book",
        series: books.map((book: Book) => ({
          ...book,
          metadata: book.metadata ? JSON.parse(book.metadata) : {},
        })),
      });
    } catch (error) {
      console.error("Failed to load local books:", error);
      setLocalLibraryError(
        error instanceof Error ? error.message : "Failed to load local books"
      );
      setLibraryData(null);
    } finally {
      setIsLoadingLocalLibrary(false);
    }
  };

  const loadLocalManga = async (): Promise<void> => {
    try {
      setIsLoadingLocalLibrary(true);
      setLocalLibraryError(null);

      const series = await db.select(
        "SELECT * FROM MangaSeries ORDER by title ASC"
      );

      setLibraryData({
        id: 9998,
        name: "Local Manga",
        type: "manga",
        series: series.map((series: Series) => ({
          ...series,
          manga_data: series.manga_data ? JSON.parse(series.manga_data) : {},
        })),
      });
    } catch (error) {
      console.error("Failed to load local manga:", error);
      setLocalLibraryError(
        error instanceof Error ? error.message : "Failed to load local manga"
      );
      setLibraryData(null);
    } finally {
      setIsLoadingLocalLibrary(false);
    }
  };

  useEffect(() => {
    if (!libraryId) {
      setLibraryData(null);
      return;
    }

    if (libraryId === 9999) {
      loadLocalBooks();
    } else if (libraryId === 9998) {
      loadLocalManga();
    }
  }, [libraryId]);

  return {
    retrieveLibraries,
    retrieveLibrary,
    scanLibrary,
    getRecentlyRead,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    refreshLibrary,
    createCollection,
    library,
    isLoadingLocalLibrary,
    localLibraryError,
    loadLocalBooks,
    loadLocalManga,
    addToCollection,
    removeFromCollection,
    deleteCollection,
    scanStatus,
    getScanStatus,
    openLocalFile,
    importLibrary,
  };
}
