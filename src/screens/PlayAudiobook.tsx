import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import {
  AudiobookSeries,
  AudiobookTrack,
  useAudiobook,
} from "../hooks/useAudiobook";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useImageLoader } from "../hooks/useImageLoader";
import { useLibraryStore } from "../store/library";
import { useAudioPlayerStore } from "../store/audioPlayer";
import { useAudioTimeStore } from "../store/audioTime";
import { audioSingleton } from "../lib/audioSingleton";
import { SeekBar } from "../components/atoms/audio/AudioSeekBar";
import Button from "../components/atoms/Button";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CurrentTimeDisplay() {
  const currentTime = useAudioTimeStore((s) => s.currentTime);
  return <span>{formatTime(Math.floor(currentTime))}</span>;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayAudiobookScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { seriesId, trackId } = useParams();
  const { retrieveFiles } = useAudiobook();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<AudiobookTrack | null>(null);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(() =>
    audioSingleton.getPlaybackRate(),
  );
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server") || null;
  const { series, retrieveSeries, retrieveLocalSeries } = useAudiobook();
  const { playTrack } = useAudioPlayer(isLocal, localServer);
  const { filesData, libraryId } = useLibraryStore(
    useShallow((state) => ({
      filesData: state.filesData,
      libraryId: state.libraryId,
    })),
  );

  const shouldLoadImage =
    series && (isLocal || (libraryId !== null && libraryId !== undefined));

  const { imagePath, isLoading: imageLoading } = useImageLoader({
    type: "audiobook",
    entity: series || ({ id: -1 } as AudiobookSeries),
    libraryId: libraryId || 0,
    offline: isLocal,
  });

  const isThisTrackActive = useAudioPlayerStore(
    (s) => s.activeTrackId === file?.id,
  );
  const isThisTrackPlaying = useAudioPlayerStore(
    (s) => s.activeTrackId === file?.id && s.isPlaying,
  );

  useEffect(() => {
    if (isLocal) {
      retrieveLocalSeries(Number(seriesId), localServer || "");
    } else {
      if (seriesId) {
        retrieveSeries(Number(seriesId));
      }
    }
  }, [seriesId, retrieveSeries, retrieveLocalSeries, isLocal, localServer]);

  useEffect(() => {
    if (!isLocal && seriesId) {
      retrieveFiles(Number(seriesId));
    }
  }, [seriesId, localServer, isLocal]);

  useEffect(() => {
    if (filesData) {
      const fileData = (filesData as AudiobookTrack[]).find(
        (f) => f.id === Number(trackId),
      );
      if (fileData) {
        setFile(fileData as AudiobookTrack);
      }
    }
  }, [filesData, trackId]);

  useEffect(() => {
    useAudioPlayerStore.getState().setAudioContext(isLocal, localServer);
  }, [isLocal, localServer]);

  const sortedTracks = useMemo(
    () =>
      [...((filesData ?? []) as AudiobookTrack[])].sort(
        (a, b) => a.track_number - b.track_number,
      ),
    [filesData],
  );

  const totalSeconds = useMemo(
    () =>
      ((filesData ?? []) as AudiobookTrack[]).reduce(
        (sum, t) => sum + t.duration_seconds,
        0,
      ),
    [filesData],
  );

  const handlePrev = () => {
    if (!file || !series) return;
    const ct = audioSingleton.getAudio().currentTime;
    if (ct > 5) {
      audioSingleton.getAudio().currentTime = 0;
      useAudioTimeStore.getState().setCurrentTime(0);
      return;
    }
    const idx = sortedTracks.findIndex((t) => t.id === file.id);
    if (idx <= 0) return;
    const prev = sortedTracks[idx - 1];
    setFile(prev);
    playTrack(prev, series);
    navigate(
      `/audiobook/${series.id}/${prev.id}/play?isLocal=${isLocal}&server=${localServer ?? ""}`,
      { replace: true },
    );
  };

  const handleNext = useCallback(() => {
    if (!file || !series) return;
    const idx = sortedTracks.findIndex((t) => t.id === file.id);
    if (idx < 0 || idx >= sortedTracks.length - 1) return;
    const next = sortedTracks[idx + 1];
    setFile(next);
    playTrack(next, series);
    navigate(
      `/audiobook/${series.id}/${next.id}/play?isLocal=${isLocal}&server=${localServer ?? ""}`,
      { replace: true },
    );
  }, [file, series, sortedTracks, isLocal, localServer, playTrack, navigate]);

  useEffect(() => {
    const audio = audioSingleton.getAudio();
    audio.addEventListener("ended", handleNext);
    return () => audio.removeEventListener("ended", handleNext);
  }, [handleNext]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioSingleton.getAudio().volume = val;
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioSingleton.setPlaybackRate(rate);
  };

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-24 pt-8">
        {!series || !file ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-[1rem] pb-[4rem]">
              <Button
                aria-label={t("common.returnToLibrary")}
                onPress={() => {
                  navigate(`/audiobook/${seriesId}`);
                }}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <div className="mt-5 md:mt-0 bg-black p-5 rounded-xl text-white justify-center max-w-md mx-auto flex flex-col gap-5 items-center">
                <div>
                  {!shouldLoadImage || imageLoading ? (
                    <div className="w-full h-64 bg-gray-300 rounded-xl animate-pulse flex items-center justify-center">
                      <span className="text-gray-500">
                        {t("common.loading")}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={imagePath || ""}
                      alt="Audiobook cover"
                      className="w-full h-auto rounded-xl"
                    />
                  )}
                </div>

                <div className="font-semibold">
                  {filesData && (filesData as AudiobookTrack[]).length > 1
                    ? `Track ${file.track_number}`
                    : "Full Audiobook"}
                </div>

                <div className="w-full flex flex-row justify-between items-center text-sm">
                  {isThisTrackActive ? (
                    <CurrentTimeDisplay />
                  ) : (
                    <span>
                      {formatTime(Number(file.current_position_seconds))}
                    </span>
                  )}
                  <span>{formatTime(file.duration_seconds)}</span>
                </div>

                <div className="w-full bg-gray-900 p-5 flex items-center rounded-xl">
                  <SeekBar
                    duration={file.duration_seconds}
                    staticValue={
                      isThisTrackActive
                        ? undefined
                        : Number(file.current_position_seconds)
                    }
                  />
                </div>

                <div className="flex flex-row items-center gap-8">
                  <button
                    className="hover:cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                    onClick={handlePrev}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="white"
                      viewBox="0 0 24 24"
                      className="size-7"
                    >
                      <path d="M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V8.69c0-1.44-1.555-2.343-2.805-1.628L12 11.029v-2.34c0-1.44-1.555-2.343-2.805-1.628l-7.108 4.061c-1.26.72-1.26 2.536 0 3.256l7.108 4.061Z" />
                    </svg>
                  </button>
                  <button
                    className="rounded-full bg-black/25 p-1 hover:cursor-pointer"
                    onClick={() => playTrack(file, series)}
                  >
                    {isThisTrackPlaying ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="white"
                        className="size-10"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.562.562 0 0 1 9 14.437V9.564Z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="white"
                        className="size-10"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    className="hover:cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                    onClick={handleNext}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="white"
                      viewBox="0 0 24 24"
                      className="size-7"
                    >
                      <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.347 12 7.25 12 8.69v2.34L5.055 7.06Z" />
                    </svg>
                  </button>
                </div>
                <div className="w-full bg-gray-900 p-5 flex items-center rounded-xl">
                  <div className="w-full flex flex-row items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="white"
                      className="size-5 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                      />
                    </svg>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      style={{
                        background: `linear-gradient(to right, rgba(255,255,255,0.85) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-2 flex-wrap justify-center">
                  {SPEEDS.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-3 py-1 rounded-full text-sm hover:cursor-pointer transition-colors ${
                        playbackRate === rate
                          ? "bg-white text-black"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
                {file.metadata?.bitrate != null && (
                  <div className="text-sm text-gray-400">
                    {file.metadata.bitrate} kbps
                  </div>
                )}
                <div className="text-sm text-white">
                  <span className="font-semibold">Total:</span>{" "}
                  {formatTime(totalSeconds)}
                </div>
              </div>
            </div>
          </>
        )}
      </Container>
      <TabBar />
    </div>
  );
}
