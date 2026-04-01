import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { invoke } from "@tauri-apps/api/core";
import { mkdir, remove, BaseDirectory } from "@tauri-apps/plugin-fs";
import { join, appLocalDataDir } from "@tauri-apps/api/path";

import { File, Series } from "./useManga";
import { Book } from "./useBook";
import { AudiobookTrack, AudiobookSeries } from "./useAudiobook";
import { useCommonStore } from "../store/common";
import { useImportStore } from "../store/import";
import { Library } from "./useLibrary";
import { db } from "../lib/database";
import { useLibraryStore } from "../store/library";

const BATCH_SIZE = 2;

export function useImport() {
  const { setCurrentQueue, setProcessing, currentQueue, processing } =
    useImportStore(
      useShallow((state) => ({
        setCurrentQueue: state.setCurrentQueue,
        setProcessing: state.setProcessing,
        currentQueue: state.currentQueue,
        processing: state.processing,
      })),
    );
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData as unknown as Library,
    })),
  );
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    })),
  );

  const processQueue = async () => {
    if (processing) {
      return;
    }

    setProcessing(true);

    console.info("Processing queue", currentQueue);

    const itemsInQueue = currentQueue;
    const itemsToProcess = itemsInQueue.slice(0, BATCH_SIZE);

    await Promise.all(itemsToProcess.map((item) => processItem(item)));
    await new Promise((resolve) => setTimeout(resolve, 50));

    setCurrentQueue(
      currentQueue.filter((item) => !itemsToProcess.includes(item)),
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const latestState = useImportStore.getState();

    if (latestState.currentQueue.length > 0) {
      setProcessing(false);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await processQueue();
    } else {
      setProcessing(false);
    }
  };

  const processItem = async (item: {
    type: "book" | "series" | "file" | "audiobook-track";
    server: string;
    entity: Book | Series | File | AudiobookTrack;
    series?: AudiobookSeries;
  }) => {
    console.info("Processing item", item);

    if (item.type === "book") {
      return processBook(item.entity as Book, item.server);
    } else if (item.type === "series") {
      return processSeries(item.entity as Series, item.server);
    } else if (item.type === "file") {
      return processFile(item.entity as File, item.server);
    } else if (item.type === "audiobook-track") {
      return processAudiobookTrack(
        item.entity as AudiobookTrack,
        item.series as AudiobookSeries,
        item.server,
      );
    }

    return false;
  };

  const processBook = async (book: Book, server: string) => {
    console.info("Processing book", book);

    try {
      const existingBook = await db.select(
        "SELECT * FROM BookFile WHERE file_id = ? AND server = ?",
        [book.id, server],
      );

      if (existingBook && existingBook.length > 0) {
        return true;
      }

      console.info("Inserting book", book);
      console.info([
        book.id,
        book.title,
        book.path,
        book.file_name,
        book.file_format,
        book.total_pages,
        "0",
        book.is_read,
        libraryData?.id,
        JSON.stringify(book.metadata),
        server,
      ]);

      await db.execute(
        "INSERT INTO BookFile (file_id, title, path, file_name, file_format, total_pages, current_page, is_read, library_id, metadata, server) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          book.id,
          book.title,
          book.path,
          book.file_name,
          book.file_format,
          book.total_pages,
          "0",
          book.is_read,
          libraryData?.id,
          JSON.stringify(book.metadata),
          server,
        ],
      );

      const localDataDir = await appLocalDataDir();
      const safeServer = server.replace(/[/:?&]/g, "_");

      await initializeFolder("book", book.id);

      const path = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "books",
        String(book.id),
        "files",
        book.file_name,
      );

      await invoke("download_file", {
        url: `${server}/stream/${libraryData?.id}/${book.id}`,
        path,
      });

      await downloadCoverImage("book", libraryData?.id, book.id);

      console.info("processed book", book);

      return true;
    } catch (error) {
      console.error("Error processing book", error);
      return false;
    }
  };

  const processSeries = async (series: Series, server: string) => {
    console.info("Processing series", series, server);
  };

  const processAudiobookTrack = async (
    track: AudiobookTrack,
    _series: AudiobookSeries,
    server: string,
  ) => {
    console.info("Attempting to process audiobook track", track);
    try {
      const existingTrack = await db.select(
        "SELECT * FROM AudiobookFile WHERE file_id = ? AND server = ?",
        [track.id, server],
      );

      if (existingTrack && (existingTrack as any[]).length > 0) {
        console.info("Track already exists", existingTrack);
        return true;
      }

      console.info("Inserting track", track);

      const localDataDir = await appLocalDataDir();
      const safeServer = server.replace(/[/:?&]/g, "_");

      const path = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "audiobooks",
        String(track.series_id),
        "files",
        track.file_name,
      );

      await db.execute(
        "INSERT INTO AudiobookFile (file_id, path, file_name, file_format, track_number, duration_seconds, current_position_seconds, is_listened, series_id, metadata, server) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          track.id,
          path,
          track.file_name,
          track.file_format,
          track.track_number,
          track.duration_seconds,
          track.current_position_seconds ?? "0",
          track.is_listened ?? false,
          track.series_id,
          JSON.stringify(track.metadata ?? {}),
          server,
        ],
      );

      await invoke("download_file", {
        url: `${server}/stream/${libraryData?.id}/${track.id}`,
        path,
      });

      return true;
    } catch (error) {
      console.error("Error processing audiobook track", error);
      return false;
    }
  };

  const processFile = async (file: File, server: string) => {
    console.info("Attempting to process manga file", file);

    try {
      console.info("Checking if file exists", file.id, server);

      const existingFile = await db.select(
        "SELECT * FROM MangaFile WHERE file_id = ? AND server = ?",
        [file.id, server],
      );

      if (existingFile && existingFile.length > 0) {
        console.info("File already exists", existingFile);
        return true;
      }

      console.info("Inserting file", file);

      await db.execute(
        "INSERT INTO MangaFile (file_id, path, file_name, file_format, volume, chapter, total_pages, current_page, is_read, series_id, metadata, server) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          file.id,
          file.path,
          file.file_name,
          file.file_format,
          file.volume,
          file.chapter,
          file.total_pages,
          file.current_page ?? 0,
          file.is_read,
          file.series_id,
          JSON.stringify(file.metadata),
          server,
        ],
      );

      const localDataDir = await appLocalDataDir();
      const safeServer = server.replace(/[/:?&]/g, "_");

      const path = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "series",
        String(file.series_id),
        "files",
        file.file_name,
      );

      await invoke("download_file", {
        url: `${server}/stream/${libraryData?.id}/${file.id}`,
        path,
      });

      const imagePath = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "series",
        String(file.series_id),
        "files",
        `${file.id}.jpg`,
      );

      await invoke("download_file", {
        url: `${server}/preview-image/${libraryData?.id}/${file.series_id}/${file.id}.jpg`,
        path: imagePath,
      });

      return true;
    } catch (error) {
      console.error("Error processing file", error);
      return false;
    }
  };

  const initializeFolder = async (type: string, seriesId?: number) => {
    const safeServer = server.replace(/[/:?&]/g, "_");

    let path = null as string | null;

    if (type === "series") {
      path = `${BaseDirectory.AppLocalData}/${safeServer}/series/${seriesId}/files`;
    } else if (type === "book") {
      path = `${BaseDirectory.AppLocalData}/${safeServer}/books/${seriesId}/files`;
    }

    if (!path) {
      return false;
    }

    try {
      await mkdir(path, {
        baseDir: BaseDirectory.AppLocalData,
        recursive: true,
      });
    } catch (error) {
      console.error("mkdir", error);
    }
  };

  const addToQueue = useCallback(
    async (
      type: "file" | "book" | "audiobook-track",
      file: Book | File | AudiobookTrack,
      series?: Series | AudiobookSeries,
    ): Promise<boolean> => {
      try {
        if (!libraryData) {
          return false;
        }

        console.info("Adding to queue", libraryData.id, type, file, series);

        if (type === "file" && series) {
          const queueItem = {
            type: "file",
            entity: file,
            series,
            server,
          };

          setCurrentQueue([...currentQueue, queueItem]);
        } else if (type === "book" && file) {
          const queueItem = {
            type: "book",
            entity: file,
            server,
          };

          setCurrentQueue([...currentQueue, queueItem]);
        } else if (type === "audiobook-track" && series) {
          const queueItem = {
            type: "audiobook-track",
            entity: file,
            series,
            server,
          };

          setCurrentQueue([...currentQueue, queueItem]);
        }

        return true;
      } catch (error) {
        console.error("Error adding to queue", error);
        return false;
      }
    },
    [currentQueue, libraryData, server, setCurrentQueue],
  );

  const downloadCoverImage = async (
    type: string,
    libraryId: number,
    seriesId: number,
  ) => {
    let imagePath = null as string | null;

    try {
      const localDataDir = await appLocalDataDir();
      const safeServer = server.replace(/[/:?&]/g, "_");

      if (type === "book") {
        imagePath = await join(
          localDataDir,
          String(BaseDirectory.AppLocalData),
          safeServer,
          "books",
          String(seriesId),
          "files",
          "cover.jpg",
        );
      } else {
        imagePath = await join(
          localDataDir,
          String(BaseDirectory.AppLocalData),
          safeServer,
          "series",
          String(seriesId),
          "cover.jpg",
        );
      }

      if (!imagePath) {
        return false;
      }

      await invoke("download_file", {
        url: `${server}/cover-image/${libraryId}/${seriesId}.jpg`,
        path: imagePath,
      });

      return true;
    } catch (error) {
      console.error("Error downloading cover image", error);
      return false;
    }
  };

  const removeBook = async (bookId: number, server: string) => {
    try {
      const safeServer = server.replace(/[/:?&]/g, "_");

      await db.execute(
        "DELETE FROM BookFile WHERE file_id = ? AND server = ?",
        [bookId, server],
      );

      try {
        await remove(
          `${BaseDirectory.AppLocalData}/${safeServer}/books/${bookId}`,
          {
            baseDir: BaseDirectory.AppLocalData,
            recursive: true,
          },
        );
      } catch (error) {
        console.error("Error removing folder", error);
      }

      return true;
    } catch (error) {
      console.error("Error removing database entry", error);
      return false;
    }
  };

  const removeSeries = async (seriesId: number, server: string) => {
    try {
      const safeServer = server.replace(/[/:?&]/g, "_");

      const series = await db.select(
        "SELECT * FROM MangaSeries WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      if (!series || series.length === 0) {
        return false;
      }

      await db.execute(
        "DELETE FROM MangaSeries WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      try {
        await remove(
          `${BaseDirectory.AppLocalData}/${safeServer}/series/${seriesId}`,
          {
            baseDir: BaseDirectory.AppLocalData,
            recursive: true,
          },
        );
      } catch (error) {
        console.error("Error removing folder", error);
      }

      await db.execute(
        "DELETE FROM MangaFile WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      return true;
    } catch (error) {
      console.error("Error removing database entry", error);
      return false;
    }
  };

  const removeFile = async (fileId: number, server: string) => {
    try {
      const safeServer = server.replace(/[/:?&]/g, "_");

      const file = await db.select(
        "SELECT * FROM MangaFile WHERE file_id = ? AND server = ?",
        [fileId, server],
      );

      if (!file || file.length === 0) {
        return false;
      }

      await db.execute(
        "DELETE FROM MangaFile WHERE file_id = ? AND server = ?",
        [fileId, server],
      );

      try {
        await remove(
          `${BaseDirectory.AppLocalData}/${safeServer}/series/${file[0].series_id}/files/${file[0].file_name}`,
          {
            baseDir: BaseDirectory.AppLocalData,
          },
        );
      } catch (error) {
        console.error("Error removing folder", error);
      }

      try {
        await remove(
          `${BaseDirectory.AppLocalData}/${safeServer}/series/${file[0].series_id}/files/${file[0].file_name}.jpg`,
          {
            baseDir: BaseDirectory.AppLocalData,
          },
        );
      } catch (error) {
        console.error("Error removing folder", error);
      }

      return true;
    } catch (error) {
      console.error("Error removing database entry", error);
      return false;
    }
  };

  const removeAudiobookSeries = async (seriesId: number, server: string) => {
    try {
      const safeServer = server.replace(/[/:?&]/g, "_");

      const existing = await db.select(
        "SELECT * FROM AudiobookSeries WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      if (!existing || (existing as any[]).length === 0) {
        return false;
      }

      await db.execute(
        "DELETE FROM AudiobookSeries WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      await db.execute(
        "DELETE FROM AudiobookFile WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      try {
        await remove(
          `${BaseDirectory.AppLocalData}/${safeServer}/audiobooks/${seriesId}`,
          { baseDir: BaseDirectory.AppLocalData, recursive: true },
        );
      } catch (error) {
        console.error("Error removing audiobook folder", error);
      }

      return true;
    } catch (error) {
      console.error("Error removing audiobook series", error);
      return false;
    }
  };

  const removeAudiobookTrack = async (
    trackId: number,
    seriesId: number,
    server: string,
  ) => {
    try {
      const safeServer = server.replace(/[/:?&]/g, "_");

      const file = await db.select(
        "SELECT * FROM AudiobookFile WHERE file_id = ? AND server = ?",
        [trackId, server],
      );

      if (!file || (file as any[]).length === 0) {
        return false;
      }

      await db.execute(
        "DELETE FROM AudiobookFile WHERE file_id = ? AND server = ?",
        [trackId, server],
      );

      try {
        await remove(
          `${BaseDirectory.AppLocalData}/${safeServer}/audiobooks/${seriesId}/files/${(file as any[])[0].file_name}`,
          { baseDir: BaseDirectory.AppLocalData },
        );
      } catch (error) {
        console.error("Error removing audiobook track file", error);
      }

      return true;
    } catch (error) {
      console.error("Error removing audiobook track", error);
      return false;
    }
  };

  return {
    addToQueue,
    processQueue,
    removeBook,
    removeSeries,
    removeFile,
    removeAudiobookSeries,
    removeAudiobookTrack,
    initializeFolder,
    downloadCoverImage,
  };
}
