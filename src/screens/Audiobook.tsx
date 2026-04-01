import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import EntityNav from "../components/molecules/common/EntityNav";
import EntityRating from "../components/molecules/common/EntityRating";
import EntityTags from "../components/molecules/common/EntityTags";
import TrackCard from "../components/molecules/audiobook/TrackCard";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { AudiobookSeries, AudiobookTrack, useAudiobook } from "../hooks/useAudiobook";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useImageLoader } from "../hooks/useImageLoader";
import { useLibraryStore } from "../store/library";

function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function AudiobookScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server");
  const { series, offlineAvailability, retrieveSeries, retrieveLocalSeries } = useAudiobook();
  const { playTrack } = useAudioPlayer(isLocal, localServer);
  const { filesData, libraryId } = useLibraryStore(
    useShallow((state) => ({
      filesData: state.filesData,
      libraryId: state.libraryId,
    }))
  );

  const shouldLoadImage =
    series && (isLocal || (libraryId !== null && libraryId !== undefined));

  const { imagePath, isLoading: imageLoading } = useImageLoader({
    type: "audiobook",
    entity: series || ({ id: -1 } as AudiobookSeries),
    libraryId: libraryId || 0,
    offline: isLocal,
  });

  useEffect(() => {
    if (isLocal) {
      retrieveLocalSeries(Number(id), localServer || "");
    } else {
      if (id) {
        retrieveSeries(Number(id));
      }
    }
  }, [id, retrieveSeries, retrieveLocalSeries, isLocal, localServer]);

  const audiobookData = series?.audiobook_data || {};
  const authors: string[] = Array.isArray(audiobookData.authors)
    ? audiobookData.authors.map((a: any) => (typeof a === "string" ? a : a.name)).filter(Boolean)
    : [];
  const narrators: string[] = Array.isArray(audiobookData.narrators)
    ? audiobookData.narrators.map((n: any) => (typeof n === "string" ? n : n.name)).filter(Boolean)
    : [];

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-24 pt-8">
        {!series ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-[1rem]">
              <EntityNav
                type="series"
                entity={series}
                libraryId={libraryId || 0}
                isLocal={isLocal}
                offlineAvailability={offlineAvailability}
                localServer={localServer}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-5">
                <div>
                  <div className="mb-[1rem]">
                    {!shouldLoadImage || imageLoading ? (
                      <div className="w-full h-64 bg-gray-300 rounded-xl animate-pulse flex items-center justify-center">
                        <span className="text-gray-500">{t("common.loading")}</span>
                      </div>
                    ) : (
                      <img
                        src={imagePath || ""}
                        alt="Audiobook cover"
                        className="w-full h-auto rounded-xl"
                      />
                    )}
                  </div>
                  {!isLocal && (
                    <EntityRating
                      series={series}
                      retrieveSeries={() => {
                        if (isLocal) {
                          retrieveLocalSeries(Number(id), localServer || "");
                        } else {
                          if (id) {
                            retrieveSeries(Number(id));
                          }
                        }
                      }}
                    />
                  )}
                  <div className="bg-primary rounded-xl p-3 mb-[1rem] text-white text-sm mt-[1rem] flex flex-col gap-1">
                    {series.total_duration_seconds > 0 && (
                      <div>
                        <span className="font-bold">Duration:</span>{" "}
                        {formatTotalDuration(series.total_duration_seconds)}
                      </div>
                    )}
                    {authors.length > 0 && (
                      <div>
                        <span className="font-bold">
                          {authors.length === 1 ? "Author" : "Authors"}:
                        </span>{" "}
                        {authors.join(", ")}
                      </div>
                    )}
                    {narrators.length > 0 && (
                      <div>
                        <span className="font-bold">
                          {narrators.length === 1 ? "Narrator" : "Narrators"}:
                        </span>{" "}
                        {narrators.join(", ")}
                      </div>
                    )}
                    {audiobookData.publisher && (
                      <div>
                        <span className="font-bold">Publisher:</span> {audiobookData.publisher}
                      </div>
                    )}
                    {audiobookData.release_date && (
                      <div>
                        <span className="font-bold">Released:</span>{" "}
                        {new Date(audiobookData.release_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-3 pb-[8rem]">
                  {!isLocal && <EntityTags tags={series.tags || []} />}
                  {audiobookData.description && (
                    <p className="text-white text-sm mt-[1rem] leading-relaxed">
                      {audiobookData.description}
                    </p>
                  )}
                  {filesData && (filesData as AudiobookTrack[]).length > 0 && (
                    <div className="flex flex-col gap-2 mt-4">
                      {(filesData as AudiobookTrack[]).map((track: AudiobookTrack) => (
                        <TrackCard
                          key={track.id}
                          entity={track}
                          offline={isLocal}
                          series={series}
                          onPlay={playTrack}
                        />
                      ))}
                    </div>
                  )}
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
