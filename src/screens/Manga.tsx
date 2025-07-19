import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

import EntityNav from "../components/molecules/common/EntityNav";
import EntityRating from "../components/molecules/common/EntityRating";
import AuthorsGenres from "../components/molecules/manga/AuthorsGenres";
import FileCard from "../components/molecules/manga/FileCard";
import MangaDescription from "../components/molecules/manga/MangaDescription";
import MangaInfo from "../components/molecules/manga/MangaInfo";
import MangaTitles from "../components/molecules/manga/MangaTitles";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useManga, Series, File } from "../hooks/useManga";
import { useImageLoader } from "../hooks/useImageLoader";
import { useLibraryStore } from "../store/library";

export default function MangaScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server");
  const { series, offlineAvailability, retrieveSeries, retrieveLocalSeries } =
    useManga();
  const { filesData, libraryId } = useLibraryStore(
    useShallow((state) => ({
      filesData: state.filesData,
      libraryId: state.libraryId,
    }))
  );

  const shouldLoadImage =
    series && (isLocal || (libraryId !== null && libraryId !== undefined));

  const { imagePath, isLoading: imageLoading } = useImageLoader({
    type: "manga",
    entity: series || ({ id: -1, series_id: -1 } as Series),
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
                        <span className="text-gray-500">
                          {t("common.loading")}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={imagePath || ""}
                        alt="Series cover"
                        className="w-full h-auto rounded-xl"
                      />
                    )}
                  </div>
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
                  <AuthorsGenres series={series} />
                  <MangaTitles series={series} />
                  <MangaInfo series={series} />
                </div>
                <div className="col-span-3 pb-[8rem]">
                  <MangaDescription series={series} />
                  {filesData && (filesData as File[]).length > 0 && (
                    <div className="mt-[1rem] grid grid-cols-1 md:grid-cols-5 gap-5 auto-rows-fr">
                      {filesData &&
                        (filesData as File[]).map((file: File) => (
                          <FileCard
                            key={file.id}
                            entity={file}
                            offline={isLocal}
                            series={series}
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
