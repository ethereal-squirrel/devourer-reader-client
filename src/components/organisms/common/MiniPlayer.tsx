import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { convertFileSrc } from "@tauri-apps/api/core";

import { audioSingleton } from "../../../lib/audioSingleton";
import { AudiobookTrack } from "../../../hooks/useAudiobook";
import { useAudioPlayerStore } from "../../../store/audioPlayer";
import { useAudioTimeStore } from "../../../store/audioTime";
import { useLibraryStore } from "../../../store/library";
import { useCommonStore } from "../../../store/common";

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MiniPlayer() {
  const navigate = useNavigate();
  const { activeFileId, isPlaying, activeLibraryId, isLocal, localServer } =
    useAudioPlayerStore(
      useShallow((s) => ({
        activeFileId: s.activeFileId,
        isPlaying: s.isPlaying,
        activeLibraryId: s.activeLibraryId,
        isLocal: s.isLocal,
        localServer: s.localServer,
      })),
    );
  const currentTime = useAudioTimeStore((s) => s.currentTime);
  const filesData = useLibraryStore((s) => s.filesData);
  const server = useCommonStore((s) => s.server);

  if (!activeFileId || !filesData) return null;

  const tracks = [...((filesData ?? []) as AudiobookTrack[])].sort(
    (a, b) => a.track_number - b.track_number,
  );
  const currentTrack = tracks.find((t) => t.id === activeFileId);
  if (!currentTrack) return null;

  const currentIdx = tracks.findIndex((t) => t.id === activeFileId);

  const switchTrack = (track: AudiobookTrack) => {
    const src = isLocal
      ? convertFileSrc(track.path)
      : `${localServer ?? server}/stream/${activeLibraryId}/${track.id}`;
    useAudioPlayerStore.getState().setAudioContext(isLocal, localServer);
    audioSingleton.play(src, Number(track.current_position_seconds) || 0);
    useAudioPlayerStore.getState().setPlaying(track.id, activeLibraryId!, track.id);
  };

  const handlePrev = () => {
    const ct = audioSingleton.getAudio().currentTime;
    if (ct > 5) {
      audioSingleton.getAudio().currentTime = 0;
      useAudioTimeStore.getState().setCurrentTime(0);
      return;
    }
    if (currentIdx <= 0) return;
    switchTrack(tracks[currentIdx - 1]);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioSingleton.pause();
      useAudioPlayerStore.getState().setPaused();
    } else {
      audioSingleton.resume();
      useAudioPlayerStore.getState().setPlaying(activeFileId, activeLibraryId!, activeFileId);
    }
  };

  const handleNext = () => {
    if (currentIdx < 0 || currentIdx >= tracks.length - 1) return;
    switchTrack(tracks[currentIdx + 1]);
  };

  const handleTitleClick = () => {
    navigate(
      `/audiobook/${currentTrack.series_id}/${currentTrack.id}/play?isLocal=${isLocal}&server=${localServer ?? ""}`,
    );
  };

  const displayTitle =
    currentTrack.metadata?.title || currentTrack.file_name;

  return (
    <div className="w-full mb-2">
      <div className="w-full rounded-2xl bg-primary/90 backdrop-blur-xl px-4 py-2 shadow-xl ring-1 ring-white/20 flex flex-row items-center gap-3">
        <button
          className="flex-1 min-w-0 text-left hover:cursor-pointer"
          onClick={handleTitleClick}
        >
          <div className="text-xs text-white font-medium truncate">{displayTitle}</div>
          <div className="text-xs text-gray-400">
            {formatTime(Math.floor(currentTime))} / {formatTime(currentTrack.duration_seconds)}
          </div>
        </button>
        <div className="flex flex-row items-center gap-3 shrink-0">
          <button
            className="hover:cursor-pointer opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
            onClick={handlePrev}
            disabled={currentIdx <= 0 && audioSingleton.getAudio().currentTime <= 5}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="size-5">
              <path d="M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V8.69c0-1.44-1.555-2.343-2.805-1.628L12 11.029v-2.34c0-1.44-1.555-2.343-2.805-1.628l-7.108 4.061c-1.26.72-1.26 2.536 0 3.256l7.108 4.061Z" />
            </svg>
          </button>
          <button
            className="rounded-full bg-white/10 p-1.5 hover:cursor-pointer hover:bg-white/20 transition-colors"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.562.562 0 0 1 9 14.437V9.564Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
              </svg>
            )}
          </button>
          <button
            className="hover:cursor-pointer opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
            onClick={handleNext}
            disabled={currentIdx >= tracks.length - 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="size-5">
              <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.347 12 7.25 12 8.69v2.34L5.055 7.06Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
