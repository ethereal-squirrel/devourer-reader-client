import { useEffect } from "react";

import { AudiobookTrack } from "../../hooks/useAudiobook";
import { useShared } from "../../hooks/useShared";
import { useAudioPlayerStore } from "../../store/audioPlayer";
import { useLibraryStore } from "../../store/library";

export function PersistentAudioHandler() {
  const { pageEvent } = useShared();

  useEffect(() => {
    const cb = (positionSeconds: number) => {
      const { activeLibraryId, activeFileId, isLocal, localServer } =
        useAudioPlayerStore.getState();
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
                ? {
                    ...t,
                    current_position_seconds: String(
                      Math.floor(positionSeconds)
                    ),
                  }
                : t
            )
          );
        }
      }
    };
    useAudioPlayerStore.getState().setProgressCallback(cb);
    return () => useAudioPlayerStore.getState().setProgressCallback(null);
  }, [pageEvent]);

  return null;
}
