import { useState, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { ask } from "@tauri-apps/plugin-dialog";
import { toast } from "react-toastify";

import { useEntityFilter } from "./useEntityFilter";
import { useImport } from "./useImport";
import { Library } from "./useLibrary";
import { useRequest } from "./useRequest";
import { db } from "../lib/database";
import { useCommonStore } from "../store/common";
import { useLibraryStore } from "../store/library";

export interface Series {
  id: number;
  series_id: number;
  title: string;
  path: string;
  cover: string;
  library_id: number;
  manga_data: any;
  server?: string;
}

export interface File {
  id: number;
  file_id: number;
  path: string;
  file_name: string;
  file_format: string;
  volume: number;
  chapter: number;
  total_pages: number;
  current_page: number;
  is_read: boolean;
  series_id: number;
  metadata: any;
  server?: string;
  nextFile?: {
    id: number;
    series_id: number;
  };
}

export function useManga() {
  const [offlineAvailability, setOfflineAvailability] =
    useState<boolean>(false);
  const [series, setSeries] = useState<Series | null>(null);
  const { makeRequest } = useRequest();
  const { addToQueue, removeSeries, removeFile, initializeFolder, downloadCoverImage } =
    useImport();
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { libraryData, setFilesData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData as unknown as Library,
      setFilesData: state.setFilesData,
    }))
  );

  const {
    filter: filterManga,
    setFilter: setFilterManga,
    filteredItems: filteredMangaSeries,
  } = useEntityFilter<Series>((libraryData?.series || []) as Series[], {
    searchFields: ["title"],
    minCharacters: 3,
  });

  const isFileAvailableOffline = useCallback(
    async (fileId: number) => {
      const file = await retrieveLocalFile(fileId, server || "");
      return file !== null;
    },
    [server]
  );

  const retrieveSeries = useCallback(
    async (seriesId: number, local?: boolean) => {
      if (local) {
        const series = await retrieveLocalSeries(seriesId, server);

        setSeries(series as Series);
        return series;
      } else {
        if (!libraryData) {
          setSeries(null);
          return null;
        }

        setFilesData(null);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const series = libraryData.series.find(
          (series) => series.id === seriesId
        );

        if (series) {
          if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile") {
            const existingSeries = await db.select(
              "SELECT * FROM MangaSeries WHERE series_id = ? AND server = ?",
              [seriesId, server]
            );

            if (existingSeries && existingSeries.length > 0) {
              setOfflineAvailability(true);
            } else {
              setOfflineAvailability(false);
            }
          }
          setSeries(series as Series);
          retrieveFiles(seriesId, local);
          return series;
        } else {
          setSeries(null);
        }
      }
    },
    [libraryData]
  );

  const retrieveFiles = useCallback(
    async (seriesId: number, local?: boolean) => {
      if (local) {
        // TODO: Implement.
      } else {
        const response = await makeRequest(
          `/series/${libraryData && libraryData.id}/${seriesId}/files`,
          "GET",
          null,
          true
        );

        if (!response.status) {
          setFilesData(null);
          throw new Error("Failed to fetch files");
        }

        setFilesData(response.files as File[]);
        return response.files;
      }
    },
    [libraryData]
  );

  const retrieveFile = useCallback(async (fileId: number) => {
    const response = await makeRequest(
      `/file/${libraryData && libraryData.id}/${fileId}`,
      "GET",
      null,
      true
    );

    if (!response.status) {
      return null;
    }

    return response.file;
  }, []);

  const retrieveLocalFile = useCallback(
    async (fileId: number, server: string) => {
      const existingFile = await db.select(
        "SELECT * FROM MangaFile WHERE file_id = ? AND server = ?",
        [fileId, server]
      );

      if (existingFile && existingFile.length > 0) {
        const fileData = {
          ...existingFile[0],
          metadata: JSON.parse(existingFile[0].metadata),
        };

        return fileData;
      } else {
        return null;
      }
    },
    [db]
  );

  const retrieveLocalSeries = useCallback(
    async (seriesId: number, server: string) => {
      const existingSeries = await db.select(
        "SELECT * FROM MangaSeries WHERE series_id = ? AND server = ?",
        [seriesId, server]
      );

      if (existingSeries && existingSeries.length > 0) {
        const mangaData = {
          ...existingSeries[0],
          manga_data: JSON.parse(existingSeries[0].manga_data),
        };

        const existingFileData = await db.select(
          "SELECT * FROM MangaFile WHERE series_id = ? AND server = ?",
          [seriesId, server]
        );

        setFilesData(existingFileData as File[]);
        setSeries(mangaData as Series);
        return mangaData;
      } else {
        return null;
      }
    },
    [db]
  );

  const makeSeriesAvailableOffline = async (series: Series, file?: File) => {
    const answer = await ask(
      file
        ? "Are you sure you want to make this file available offline?"
        : "Are you sure you want to make this series available offline?",
      {
        title: "Devourer",
        kind: "info",
      }
    );

    if (answer) {
      try {
        let seriesData = null;
        let seriesExists = null;

        await initializeFolder("series", series.id);

        const existingSeries = await db.select(
          "SELECT * FROM MangaSeries WHERE series_id = ? AND server = ?",
          [series.id, server]
        );

        if (existingSeries && existingSeries.length > 0) {
          const mangaData = {
            ...existingSeries[0],
            manga_data: JSON.parse(existingSeries[0].manga_data),
          };

          seriesData = mangaData;
          seriesExists = true;
        } else {
          await db.execute(
            "INSERT INTO MangaSeries (series_id, title, path, cover, library_id, manga_data, server) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              series.id,
              series.title,
              series.path,
              series.cover,
              libraryData?.id,
              JSON.stringify(series.manga_data),
              server,
            ]
          );

          const existingSeries = await db.select(
            "SELECT * FROM MangaSeries WHERE series_id = ? AND server = ?",
            [series.id, server]
          );

          seriesData = existingSeries[0];
        }

        if (!seriesExists) {
          console.log("Downloading cover image.");

          await downloadCoverImage(
            "series",
            seriesData.library_id,
            seriesData.series_id
          );
        }

        if (file) {
          await addToQueue("file", file, seriesData);
        } else {
          const files = await retrieveFiles(seriesData.series_id, false);

          for (const file of files) {
            await addToQueue("file", file, seriesData);
          }
        }

        toast.success(
          file ? "File added to queue." : "Series added to queue.",
          {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          }
        );

        return true;
      } catch (error) {
        console.error(error);
        toast.error(
          file
            ? "Failed to add file to queue."
            : "Failed to add series to queue.",
          {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          }
        );

        return false;
      }
    }
  };

  const makeSeriesUnavailableOffline = async (series: Series, file?: File) => {
    const answer = await ask(
      file
        ? "Are you sure you want to remove this file from offline storage?"
        : "Are you sure you want to remove this series from offline storage?",
      {
        title: "Devourer",
        kind: "warning",
      }
    );

    if (answer) {
      let outcome = false;

      if (file) {
        outcome = await removeFile(
          file.file_id ? file.file_id : file.id,
          server
        );
      } else {
        outcome = await removeSeries(
          series.series_id ? series.series_id : series.id,
          server
        );
      }

      if (outcome) {
        toast.success(
          file
            ? "File removed from offline storage."
            : "Series removed from offline storage.",
          {
            position: "bottom-right",
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
          }
        );
      } else {
        toast.error(
          file
            ? "Failed to remove file from offline storage."
            : "Failed to remove series from offline storage.",
          {
            position: "bottom-right",
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
          }
        );
      }
    }
  };
  return {
    series,
    offlineAvailability,
    setOfflineAvailability,
    retrieveSeries,
    retrieveLocalSeries,
    retrieveFiles,
    retrieveFile,
    retrieveLocalFile,
    makeSeriesAvailableOffline,
    makeSeriesUnavailableOffline,
    filteredMangaSeries,
    filterManga,
    setFilterManga,
    isFileAvailableOffline,
  };
}
