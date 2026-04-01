import { create } from "zustand";

interface AudioTimeState {
  currentTime: number;
  setCurrentTime: (t: number) => void;
}

export const useAudioTimeStore = create<AudioTimeState>()((set) => ({
  currentTime: 0,
  setCurrentTime: (t) => set({ currentTime: t }),
}));
