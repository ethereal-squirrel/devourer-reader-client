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

export interface AudiobookSeries {
  id: number;
  title: string;
  path: string;
  cover: string;
  library_id: number;
  audiobook_data: any;
  total_duration_seconds: number;
  server?: string;
  rating?: number;
  userRating?: {
    rating: number;
  };
  tags?: string[];
}

export interface AudiobookTrack {
  id: number;
  path: string;
  file_name: string;
  file_format: string;
  track_number: number;
  duration_seconds: number;
  current_position_seconds: string;
  is_listened: boolean;
  series_id: number;
  metadata: any;
  server?: string;
}

export function useAudiobook() {
  const [offlineAvailability, setOfflineAvailability] =
    useState<boolean>(false);
  const [series, setSeries] = useState<AudiobookSeries | null>(null);
  const { makeRequest } = useRequest();
  const {
    addToQueue,
    removeAudiobookSeries,
    removeAudiobookTrack,
    initializeFolder,
    downloadCoverImage,
  } = useImport();
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    })),
  );
  const { libraryData, setFilesData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData as unknown as Library,
      setFilesData: state.setFilesData,
    })),
  );

  const {
    filter: filterAudiobook,
    setFilter: setFilterAudiobook,
    filterBy: filterAudiobookBy,
    setFilterBy: setFilterAudiobookBy,
    sortBy: sortAudiobookBy,
    setSortBy: setSortAudiobookBy,
    filteredItems: filteredAudiobookSeries,
  } = useEntityFilter<AudiobookSeries>(
    (libraryData?.series || []) as AudiobookSeries[],
    {
      searchFields: [
        "title",
        (item: AudiobookSeries) => item.audiobook_data?.authors || [],
      ],
      minCharacters: 3,
    },
  );

  const isTrackAvailableOffline = useCallback(
    async (trackId: number) => {
      const track = await db.select(
        "SELECT * FROM AudiobookFile WHERE file_id = ? AND server = ?",
        [trackId, server],
      );
      return track !== null && (track as any[]).length > 0;
    },
    [server],
  );

  const retrieveSeries = useCallback(
    async (seriesId: number, local?: boolean) => {
      if (local) {
        const result = await retrieveLocalSeries(seriesId, server);
        setSeries(result as AudiobookSeries);
        return result;
      } else {
        if (!libraryData) {
          setSeries(null);
          return null;
        }

        setFilesData(null);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const { series } = await makeRequest(
          `/series/${libraryData.id}/${seriesId}`,
          "GET",
          null,
          true,
        );

        if (!series) {
          setFilesData(null);
          setSeries(null);
          throw new Error("Failed to fetch audiobook series");
        }

        if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile") {
          const existingSeries = await db.select(
            "SELECT * FROM AudiobookSeries WHERE series_id = ? AND server = ?",
            [seriesId, server],
          );

          if (existingSeries && (existingSeries as any[]).length > 0) {
            setOfflineAvailability(true);
          } else {
            setOfflineAvailability(false);
          }
        }

        setSeries(series as AudiobookSeries);
        retrieveFiles(seriesId, local);
        return series;
      }
    },
    [libraryData],
  );

  const retrieveFiles = useCallback(
    async (seriesId: number, local?: boolean) => {
      if (local) {
        return;
      } else {
        const response = await makeRequest(
          `/series/${libraryData && libraryData.id}/${seriesId}/files`,
          "GET",
          null,
          true,
        );

        if (!response.status) {
          setFilesData(null);
          throw new Error("Failed to fetch audiobook files");
        }

        setFilesData(response.files);
        return response.files;
      }
    },
    [libraryData],
  );

  const retrieveLocalSeries = useCallback(
    async (seriesId: number, server: string) => {
      const existingSeries = await db.select(
        "SELECT * FROM AudiobookSeries WHERE series_id = ? AND server = ?",
        [seriesId, server],
      );

      if (existingSeries && (existingSeries as any[]).length > 0) {
        const seriesData = {
          ...(existingSeries as any[])[0],
          audiobook_data: JSON.parse(
            (existingSeries as any[])[0].audiobook_data,
          ),
        };

        const existingTracks = await db.select(
          "SELECT * FROM AudiobookFile WHERE series_id = ? AND server = ?",
          [seriesId, server],
        );

        setFilesData(existingTracks as AudiobookTrack[]);
        setSeries(seriesData as AudiobookSeries);
        return seriesData;
      } else {
        return null;
      }
    },
    [db],
  );

  const makeSeriesAvailableOffline = async (
    series: AudiobookSeries,
    track?: AudiobookTrack,
  ) => {
    const answer = await ask(
      track
        ? "Are you sure you want to make this track available offline?"
        : "Are you sure you want to make this audiobook available offline?",
      { title: "Devourer", kind: "info" },
    );

    if (answer) {
      try {
        let seriesData = null;
        let seriesExists = null;

        await initializeFolder("audiobook", series.id);

        const existingSeries = await db.select(
          "SELECT * FROM AudiobookSeries WHERE series_id = ? AND server = ?",
          [series.id, server],
        );

        if (existingSeries && (existingSeries as any[]).length > 0) {
          seriesData = {
            ...(existingSeries as any[])[0],
            audiobook_data: JSON.parse(
              (existingSeries as any[])[0].audiobook_data,
            ),
          };
          seriesExists = true;
        } else {
          await db.execute(
            "INSERT INTO AudiobookSeries (series_id, title, path, cover, library_id, audiobook_data, total_duration_seconds, server) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              series.id,
              series.title,
              series.path,
              series.cover,
              libraryData?.id,
              JSON.stringify(series.audiobook_data),
              series.total_duration_seconds ?? 0,
              server,
            ],
          );

          seriesData = {
            series_id: series.id,
            title: series.title,
            path: series.path,
            cover: series.cover,
            library_id: libraryData?.id,
            audiobook_data: series.audiobook_data,
            total_duration_seconds: series.total_duration_seconds,
            server,
          };
        }

        if (!seriesExists) {
          await downloadCoverImage(
            "audiobook",
            seriesData.library_id,
            seriesData.series_id,
          );
        }

        if (track) {
          await addToQueue("audiobook-track", track, seriesData);
        } else {
          const tracks = await retrieveFiles(seriesData.series_id, false);
          if (tracks) {
            for (const t of tracks) {
              await addToQueue("audiobook-track", t, seriesData);
            }
          }
        }

        toast.success(
          track ? "Track added to queue." : "Audiobook added to queue.",
          {
            style: { backgroundColor: "#111827", color: "#fff" },
            position: "bottom-right",
          },
        );

        return true;
      } catch (error) {
        console.error(error);
        toast.error(
          track
            ? "Failed to add track to queue."
            : "Failed to add audiobook to queue.",
          {
            style: { backgroundColor: "#111827", color: "#fff" },
            position: "bottom-right",
          },
        );
        return false;
      }
    }
  };

  const makeSeriesUnavailableOffline = async (
    series: AudiobookSeries,
    track?: AudiobookTrack,
  ) => {
    const answer = await ask(
      track
        ? "Are you sure you want to remove this track from offline storage?"
        : "Are you sure you want to remove this audiobook from offline storage?",
      { title: "Devourer", kind: "warning" },
    );

    if (answer) {
      let outcome = false;

      if (track) {
        outcome = await removeAudiobookTrack(track.id, series.id, server);
      } else {
        outcome = await removeAudiobookSeries(series.id, server);
      }

      if (outcome) {
        toast.success(
          track
            ? "Track removed from offline storage."
            : "Audiobook removed from offline storage.",
          {
            position: "bottom-right",
            style: { backgroundColor: "#111827", color: "#fff" },
          },
        );
      } else {
        toast.error(
          track ? "Failed to remove track." : "Failed to remove audiobook.",
          {
            position: "bottom-right",
            style: { backgroundColor: "#111827", color: "#fff" },
          },
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
    makeSeriesAvailableOffline,
    makeSeriesUnavailableOffline,
    isTrackAvailableOffline,
    filteredAudiobookSeries,
    filterAudiobook,
    filterAudiobookBy,
    setFilterAudiobook,
    setFilterAudiobookBy,
    sortAudiobookBy,
    setSortAudiobookBy,
  };
}
