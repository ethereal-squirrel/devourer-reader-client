import { create } from "zustand";

interface AudioPlayerState {
  activeTrackId: number | null;
  isPlaying: boolean;
  activeLibraryId: number | null;
  activeFileId: number | null;
  progressCallback: ((t: number) => void) | null;
  isLocal: boolean;
  localServer: string | null;
  setPlaying: (trackId: number, libraryId: number, fileId: number) => void;
  setPaused: () => void;
  stop: () => void;
  setProgressCallback: (cb: ((t: number) => void) | null) => void;
  fireProgressCallback: (t: number) => void;
  onTrackEnded: () => void;
  setAudioContext: (isLocal: boolean, localServer: string | null) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set, get) => ({
  activeTrackId: null,
  isPlaying: false,
  activeLibraryId: null,
  activeFileId: null,
  progressCallback: null,
  isLocal: false,
  localServer: null,
  setPlaying: (trackId, libraryId, fileId) =>
    set({ activeTrackId: trackId, isPlaying: true, activeLibraryId: libraryId, activeFileId: fileId }),
  setPaused: () => set({ isPlaying: false }),
  stop: () => set({ activeTrackId: null, isPlaying: false, activeLibraryId: null, activeFileId: null }),
  setProgressCallback: (cb) => set({ progressCallback: cb }),
  fireProgressCallback: (t) => get().progressCallback?.(t),
  onTrackEnded: () => set({ isPlaying: false }),
  setAudioContext: (isLocal, localServer) => set({ isLocal, localServer }),
}));
