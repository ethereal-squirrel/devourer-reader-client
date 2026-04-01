import { useCallback, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useShallow } from "zustand/react/shallow";

import { AudiobookSeries, AudiobookTrack } from "./useAudiobook";
import { useShared } from "./useShared";
import { audioSingleton } from "../lib/audioSingleton";
import { useCommonStore } from "../store/common";
import { useAudioPlayerStore } from "../store/audioPlayer";
import { useAudioTimeStore } from "../store/audioTime";
import { useLibraryStore } from "../store/library";

export function useAudioPlayer(isLocal: boolean, localServer: string | null) {
  const { pageEvent } = useShared();
  const { server } = useCommonStore(useShallow((s) => ({ server: s.server })));

  useEffect(() => {
    const cb = (positionSeconds: number) => {
      const { activeLibraryId, activeFileId } = useAudioPlayerStore.getState();
      if (activeLibraryId && activeFileId) {
        pageEvent(
          Math.floor(positionSeconds),
          isLocal,
          activeLibraryId,
          activeFileId,
          localServer ?? undefined,
          "audiobook"
        );
        const { filesData, setFilesData } = useLibraryStore.getState();
        if (filesData) {
          setFilesData(
            (filesData as AudiobookTrack[]).map((t) =>
              t.id === activeFileId
                ? { ...t, current_position_seconds: String(Math.floor(positionSeconds)) }
                : t
            )
          );
        }
      }
    };
    useAudioPlayerStore.getState().setProgressCallback(cb);
    return () => useAudioPlayerStore.getState().setProgressCallback(null);
  }, [isLocal, localServer, pageEvent]);

  useEffect(() => {
    return () => {
      audioSingleton.stop();
      useAudioPlayerStore.getState().stop();
      useAudioTimeStore.getState().setCurrentTime(0);
    };
  }, []);

  const playTrack = useCallback(
    (track: AudiobookTrack, series: AudiobookSeries) => {
      const { activeTrackId, isPlaying } = useAudioPlayerStore.getState();

      if (activeTrackId === track.id) {
        if (isPlaying) {
          audioSingleton.pause();
          useAudioPlayerStore.getState().setPaused();
        } else {
          audioSingleton.resume();
          useAudioPlayerStore.getState().setPlaying(track.id, series.library_id, track.id);
        }
        return;
      }

      const src = isLocal
        ? convertFileSrc(track.path)
        : `${series.server ?? server}/stream/${series.library_id}/${track.id}`;

      audioSingleton.play(src, Number(track.current_position_seconds) || 0);
      useAudioPlayerStore.getState().setPlaying(track.id, series.library_id, track.id);
    },
    [isLocal]
  );

  return { playTrack };
}
