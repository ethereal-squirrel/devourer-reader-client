import { memo, useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { FolderArrowDownIcon, FolderPlusIcon } from "@heroicons/react/24/solid";

import {
  AudiobookSeries,
  AudiobookTrack,
  useAudiobook,
} from "../../../hooks/useAudiobook";
import { Library } from "../../../hooks/useLibrary";
import { useLibraryStore } from "../../../store/library";
import { useAudioPlayerStore } from "../../../store/audioPlayer";
import { useNavigate } from "react-router";
import {
  SeekBar,
  TimeDisplay,
  formatDuration,
} from "../../atoms/audio/AudioSeekBar";

const TrackCard = memo(
  function TrackCard({
    entity,
    offline,
    series,
    onPlay,
  }: {
    entity: AudiobookTrack;
    offline?: boolean;
    series: AudiobookSeries;
    onPlay: (track: AudiobookTrack, series: AudiobookSeries) => void;
  }) {
    const navigate = useNavigate();
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData as unknown as Library,
      })),
    );
    const {
      isTrackAvailableOffline,
      makeSeriesAvailableOffline,
      makeSeriesUnavailableOffline,
    } = useAudiobook();
    const [isAvailableOffline, setIsAvailableOffline] = useState(false);

    const isThisTrackActive = useAudioPlayerStore(
      (s) => s.activeTrackId === entity.id,
    );
    const isThisTrackPlaying = useAudioPlayerStore(
      (s) => s.activeTrackId === entity.id && s.isPlaying,
    );

    useEffect(() => {
      if (!offline) {
        isTrackAvailableOffline(entity.id).then((isAvailable) => {
          setIsAvailableOffline(isAvailable);
        });
      }
    }, [offline, entity.id, isTrackAvailableOffline]);

    const handlePlay = useCallback(() => {
      onPlay(entity, series);
    }, [onPlay, entity, series]);

    const displayTitle = entity.metadata?.title || entity.file_name;
    const trackNum = String(
      entity.track_number > 0 ? entity.track_number : "?",
    ).padStart(2, "0");
    const posSeconds = Number(entity.current_position_seconds) || 0;
    const isPartiallyListened = posSeconds > 0 && !entity.is_listened;

    if (!libraryData) return null;

    return (
      <button
        className="bg-primary text-white rounded-xl flex flex-col px-4 py-3 justify-start text-start hover:cursor-pointer"
        onClick={() => {
          navigate(`/audiobook/${series.id}/${entity.id}/play`);
        }}
      >
        <div className="flex flex-row items-center gap-3">
          <div>
            <button className="rounded-full bg-black/25 p-1">
              {isThisTrackPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="white"
                  className="size-8"
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
                  className="size-8"
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
          </div>
          <span className="font-mono text-sm text-gray-400 w-6 shrink-0">
            {trackNum}
          </span>
          <div className="flex-1 min-w-0">
            <div className="line-clamp-1 text-sm">{displayTitle}</div>
            {!isThisTrackActive && isPartiallyListened && (
              <div className="text-xs text-gray-400 mt-0.5">
                {formatDuration(posSeconds)} /{" "}
                {formatDuration(entity.duration_seconds)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isThisTrackActive && (
              <>
                <TimeDisplay />
                <span className="text-xs text-gray-400">/</span>
              </>
            )}
            <span className="text-sm text-gray-300">
              {formatDuration(entity.duration_seconds)}
            </span>
          </div>
          {entity.is_listened && (
            <div className="bg-black/50 text-white p-1 rounded-full shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          )}
          <button
            className="bg-black/50 text-white p-1.5 rounded-full hover:cursor-pointer shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailableOffline || offline) {
                makeSeriesUnavailableOffline(series, entity);
              } else {
                makeSeriesAvailableOffline(series, entity);
              }
            }}
          >
            {isAvailableOffline || offline ? (
              <FolderArrowDownIcon className="w-4 h-4 text-green-500" />
            ) : (
              <FolderPlusIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        {isThisTrackActive && (
          <div className="mt-2 px-1">
            <SeekBar duration={entity.duration_seconds} />
          </div>
        )}
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.entity.id === nextProps.entity.id &&
      prevProps.entity.is_listened === nextProps.entity.is_listened &&
      prevProps.entity.current_position_seconds ===
        nextProps.entity.current_position_seconds &&
      prevProps.offline === nextProps.offline &&
      prevProps.onPlay === nextProps.onPlay
    );
  },
);

export default TrackCard;
