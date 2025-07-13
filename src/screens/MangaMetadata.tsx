import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";

import Button from "../components/atoms/Button";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { Library, useLibrary } from "../hooks/useLibrary";
import { Series, useManga } from "../hooks/useManga";
import { useShared } from "../hooks/useShared";
import { useLibraryStore } from "../store/library";
import SearchJikanModal from "../components/organisms/manga/SearchJikanModal";

export default function MangaMetadata() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal =
    searchParams.get("local") === "book" ||
    searchParams.get("local") === "manga";
  const localType = searchParams.get("local");
  const localServer = searchParams.get("localServer");
  const { series, retrieveSeries, retrieveLocalSeries } = useManga();
  const { updateMetadata } = useShared();
  const navigate = useNavigate();
  const { retrieveLibrary } = useLibrary();
  const { libraryData, libraryId } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData,
      libraryId: state.libraryId,
    }))
  );

  const [displayJikanModal, setDisplayJikanModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<any>({} as any);

  useEffect(() => {
    if (id) {
      retrieve(Number(id));
    }
  }, [id, retrieveSeries, isLocal, localType]);

  const retrieve = async (id: number) => {
    if (isLocal) {
      const series = await retrieveLocalSeries(id, localServer || "");
      setPayload(series.manga_data);
    } else {
      const series = await retrieveSeries(id);
      setPayload((series as Series).manga_data);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-[8rem] pt-8">
        {!payload || !series || !libraryId ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-[1rem]">
              <div className="flex flex-col md:flex-row md:justify-between items-center mb-[1rem] gap-3">
                <Button
                  onPress={() => {
                    if (isLocal) {
                      navigate(
                        `/manga/${series.series_id}?isLocal=true&server=${localServer}`
                      );
                    } else {
                      navigate(`/manga/${series.id}`);
                    }
                  }}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  {t("common.returnToManga")}
                </Button>
                <Button
                  onPress={() => {
                    setDisplayJikanModal(true);
                  }}
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  {t("common.searchJikanMetadata")}
                </Button>
              </div>
              <div className="bg-primary rounded-xl p-3 text-white">
                <div className="mt-2">
                  <label htmlFor="title" className="font-semibold">
                    Default Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={payload.title || series.title}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        title: e.target.value,
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="description" className="font-semibold">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={payload.synopsis || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        synopsis: e.target.value,
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="authors" className="font-semibold">
                    Authors{" "}
                    <span className="text-xs">(separated by comma)</span>
                  </label>
                  <input
                    id="authors"
                    type="text"
                    value={payload.authors?.join(", ") || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        authors: e.target.value
                          .split(",")
                          .map((author: string) => author.trim()),
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="genres" className="font-semibold">
                    Genres <span className="text-xs">(separated by comma)</span>
                  </label>
                  <input
                    id="genres"
                    type="text"
                    value={payload.genres?.join(", ") || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        genres: e.target.value
                          .split(",")
                          .map((genre: string) => genre.trim()),
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="publishedFrom" className="font-semibold">
                    Published from
                  </label>
                  <input
                    id="publishedFrom"
                    type="text"
                    value={payload.published_from || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        published_from: e.target.value,
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="publishedTo" className="font-semibold">
                    Published to
                  </label>
                  <input
                    id="publishedTo"
                    type="text"
                    value={payload.published_to || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        published_to: e.target.value,
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="publishDate" className="font-semibold">
                    Total chapters
                  </label>
                  <input
                    id="totalChapters"
                    type="text"
                    value={payload.total_chapters || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        total_chapters: e.target.value,
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="totalVolumes" className="font-semibold">
                    Total volumes
                  </label>
                  <input
                    id="totalVolumes"
                    type="text"
                    value={payload.total_volumes || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        total_volumes: e.target.value,
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
              </div>
              <div className="mt-[1rem]">
                <Button
                  onPress={async () => {
                    if (loading) {
                      return;
                    }

                    setLoading(true);

                    const outcome = await updateMetadata(
                      libraryId,
                      isLocal ? series.series_id : series.id,
                      payload,
                      isLocal,
                      localServer || undefined
                    );

                    if (outcome) {
                      retrieveLibrary((libraryData as unknown as Library).id);
                    }

                    setLoading(false);
                  }}
                  disabled={loading}
                  className="md:w-full md:text-lg"
                >
                  {t("common.saveChanges")}
                </Button>
              </div>
            </div>
          </>
        )}
      </Container>
      {series && (
        <SearchJikanModal
          series={series}
          displayJikan={displayJikanModal}
          setDisplayJikan={setDisplayJikanModal}
        />
      )}
      <TabBar />
    </div>
  );
}
