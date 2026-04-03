import { useAudioPlayerStore } from "../store/audioPlayer";
import { useAudioTimeStore } from "../store/audioTime";

const audio = new Audio();
let intervalId: ReturnType<typeof setInterval> | null = null;
let timeupdateHandler: (() => void) | null = null;
let endedHandler: (() => void) | null = null;
let loadedmetadataHandler: (() => void) | null = null;
let currentPlaybackRate = 1;

function clearListeners() {
  if (timeupdateHandler) {
    audio.removeEventListener("timeupdate", timeupdateHandler);
    timeupdateHandler = null;
  }
  if (endedHandler) {
    audio.removeEventListener("ended", endedHandler);
    endedHandler = null;
  }
  if (loadedmetadataHandler) {
    audio.removeEventListener("loadedmetadata", loadedmetadataHandler);
    loadedmetadataHandler = null;
  }
}

export const audioSingleton = {
  play(src: string, startSeconds: number) {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (audio.currentTime > 0) {
      useAudioPlayerStore.getState().fireProgressCallback(audio.currentTime);
    }
    clearListeners();

    timeupdateHandler = () => {
      useAudioTimeStore.getState().setCurrentTime(audio.currentTime);
    };
    endedHandler = () => {
      useAudioPlayerStore.getState().onTrackEnded();
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    loadedmetadataHandler = () => {
      audio.currentTime = startSeconds;
      audio.playbackRate = currentPlaybackRate;
      audio.play();
      loadedmetadataHandler = null;
    };

    audio.addEventListener("timeupdate", timeupdateHandler);
    audio.addEventListener("ended", endedHandler);
    audio.addEventListener("loadedmetadata", loadedmetadataHandler, { once: true });
    audio.addEventListener("error", () => {
      console.error("Audio error", audio.error, "src:", audio.src);
    }, { once: true });

    audio.src = src;
    audio.load();

    intervalId = setInterval(() => {
      useAudioPlayerStore.getState().fireProgressCallback(audio.currentTime);
    }, 30000);
  },

  pause() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    useAudioPlayerStore.getState().fireProgressCallback(audio.currentTime);
    audio.pause();
  },

  stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (audio.currentTime > 0) {
      useAudioPlayerStore.getState().fireProgressCallback(audio.currentTime);
    }
    clearListeners();
    audio.pause();
    audio.src = "";
  },

  resume() {
    audio.play();
    if (intervalId === null) {
      intervalId = setInterval(() => {
        useAudioPlayerStore.getState().fireProgressCallback(audio.currentTime);
      }, 30000);
    }
  },

  setPlaybackRate(rate: number) {
    currentPlaybackRate = rate;
    audio.playbackRate = rate;
  },

  getPlaybackRate() {
    return currentPlaybackRate;
  },

  getAudio() {
    return audio;
  },
};
