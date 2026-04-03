import { useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useShallow } from "zustand/react/shallow";

import { AudiobookSeries, AudiobookTrack } from "./useAudiobook";
import { audioSingleton } from "../lib/audioSingleton";
import { useCommonStore } from "../store/common";
import { useAudioPlayerStore } from "../store/audioPlayer";

export function useAudioPlayer(isLocal: boolean, localServer: string | null) {
  const { server } = useCommonStore(useShallow((s) => ({ server: s.server })));

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

      useAudioPlayerStore.getState().setAudioContext(isLocal, localServer);
      audioSingleton.play(src, Number(track.current_position_seconds) || 0);
      useAudioPlayerStore.getState().setPlaying(track.id, series.library_id, track.id);
    },
    [isLocal, localServer, server]
  );

  return { playTrack };
}
