import { Fragment, useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";

import Actions from "../components/molecules/library/Actions";
import Filter from "../components/molecules/library/Filter";
import LibraryCard from "../components/molecules/library/LibraryCard";
import LibraryTable from "../components/molecules/library/LibraryTable";
import ViewMode from "../components/molecules/library/ViewMode";
import CollectionCard from "../components/molecules/library/CollectionCard";
import VirtualizedLibraryGrid from "../components/organisms/VirtualizedLibraryGrid";
import VirtualizedLibraryTable from "../components/organisms/VirtualizedLibraryTable";
import { CreateCollectionModal } from "../components/organisms/library/CreateCollectionModal";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { Book, useBook } from "../hooks/useBook";
import { Library, useLibrary } from "../hooks/useLibrary";
import { useLibraryImagePreloader } from "../hooks/useLibraryImagePreloader";
import { Series, useManga } from "../hooks/useManga";
import { useLibraryStore } from "../store/library";
import { useUIStore } from "../store/ui";

export default function LibraryScreen() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const local = searchParams.get("local");
  const tab = searchParams.get("tab");
  const { t } = useTranslation();
  const { libraryViewMode, setLibraryViewMode } = useUIStore(
    useShallow((state) => ({
      libraryViewMode: state.libraryViewMode,
      setLibraryViewMode: state.setLibraryViewMode,
    }))
  );
  const { setLibraryId, libraryData } = useLibraryStore(
    useShallow((state) => ({
      setLibraryId: state.setLibraryId,
      libraryData: state.libraryData as unknown as Library | null,
    }))
  );
  const { createCollection, retrieveLibrary } = useLibrary();
  const {
    filteredBookSeries,
    filterBook,
    setFilterBook,
    filterBookBy,
    setFilterBookBy,
  } = useBook();
  const {
    filteredMangaSeries,
    filterManga,
    setFilterManga,
    filterMangaBy,
    setFilterMangaBy,
  } = useManga();

  const [activeTab, setActiveTab] = useState<string>("files");
  const [filterCollections, setFilterCollections] = useState<string>("");
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [displayCreateCollectionModal, setDisplayCreateCollectionModal] =
    useState<boolean>(false);

  const VIRTUALIZATION_THRESHOLD = 1;

  const currentSeries = useMemo(
    () =>
      libraryData?.type === "book" ? filteredBookSeries : filteredMangaSeries,
    [libraryData, filteredBookSeries, filteredMangaSeries]
  );

  const shouldVirtualize = useMemo(
    () => currentSeries.length > VIRTUALIZATION_THRESHOLD,
    [currentSeries.length]
  );

  useLibraryImagePreloader();

  const filteredCollections = useMemo(() => {
    if (!libraryData) return [];
    if (!libraryData.collections) return [];
    if (filterCollections.length < 3) return libraryData.collections;

    const searchTerm = filterCollections.toLowerCase();
    return libraryData.collections.filter((collection: any) =>
      collection.name?.toLowerCase()?.includes(searchTerm)
    );
  }, [libraryData, filterCollections]);

  useEffect(() => {
    if (local === "book") {
      setLibraryId(9999);
    } else if (local === "manga") {
      setLibraryId(9998);
    } else {
      if (id) {
        setLibraryId(Number(id));
      }
    }
  }, [id, local]);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    setIsLandscape(mediaQuery.matches);

    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    mediaQuery.addEventListener("change", handleOrientationChange);

    return () => {
      mediaQuery.removeEventListener("change", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (
      libraryData &&
      libraryData.type === "manga" &&
      libraryViewMode === "table"
    ) {
      setLibraryViewMode("grid");
    }
  }, [libraryData]);

  return (
    <>
      <div className="h-screen flex flex-col bg-secondary">
        <Container className={`${!libraryData ? "flex-1" : ""} px-5 pt-8`}>
          <div className="flex flex-col items-center justify-center h-full w-full">
            {!libraryData ? (
              <div>Loading...</div>
            ) : (
              <div className="w-full">
                <Actions
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isLocal={local === "book" || local === "manga"}
                  setDisplayCreateCollectionModal={
                    setDisplayCreateCollectionModal
                  }
                  libraryId={libraryData.id}
                />
                {activeTab === "files" && (
                  <div className="mt-5">
                    <Filter
                      filter={
                        libraryData.type === "book" ? filterBook : filterManga
                      }
                      setFilter={
                        libraryData.type === "book"
                          ? setFilterBook
                          : setFilterManga
                      }
                      filterBy={
                        libraryData.type === "book"
                          ? filterBookBy
                          : filterMangaBy
                      }
                      setFilterBy={
                        libraryData.type === "book"
                          ? setFilterBookBy
                          : setFilterMangaBy
                      }
                      placeholder={
                        libraryData.type === "book"
                          ? "Filter by title or author..."
                          : "Filter by title..."
                      }
                    />
                  </div>
                )}
                {activeTab === "collections" && (
                  <div className="mt-5">
                    <Filter
                      filter={filterCollections}
                      filterBy="title"
                      setFilterBy={(filterBy) => {}}
                      setFilter={setFilterCollections}
                      placeholder="Filter by collection name..."
                    />
                  </div>
                )}
                {libraryData.type === "book" && activeTab === "files" && (
                  <ViewMode />
                )}
                <div className="mt-5">
                  <Fragment
                    key={`library-${libraryData.id}-${libraryData.type}`}
                  >
                    {activeTab === "files" ? (
                      <>
                        {libraryData && libraryData.id ? (
                          <Fragment
                            key={`library-files-${libraryData.id}-${libraryData.type}`}
                          >
                            {libraryViewMode === "grid" ? (
                              shouldVirtualize ? (
                                <VirtualizedLibraryGrid
                                  key={`library-files-virtual-grid-${libraryData.id}-${libraryData.type}`}
                                  items={currentSeries}
                                  offline={
                                    local === "book" || local === "manga"
                                  }
                                />
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-5 auto-rows-fr">
                                  {currentSeries.map(
                                    (entity: Book | Series, index: number) => (
                                      <LibraryCard
                                        key={`library-files-card-${entity.id}-${index}-${libraryData.id}`}
                                        entity={entity}
                                        offline={
                                          local === "book" || local === "manga"
                                        }
                                      />
                                    )
                                  )}
                                </div>
                              )
                            ) : shouldVirtualize ? (
                              <VirtualizedLibraryTable
                                series={currentSeries}
                                isLandscape={isLandscape}
                                offline={local === "book" || local === "manga"}
                              />
                            ) : (
                              <LibraryTable
                                series={currentSeries}
                                isLandscape={isLandscape}
                                offline={local === "book" || local === "manga"}
                              />
                            )}
                          </Fragment>
                        ) : (
                          <span>{t("library.noFiles")}</span>
                        )}
                      </>
                    ) : (
                      <>
                        {libraryData &&
                        libraryData.collections &&
                        libraryData.collections.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-5 auto-rows-fr">
                            {filteredCollections.map((collection: any) => (
                              <CollectionCard
                                key={collection.id}
                                collection={collection}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-white">
                            {t("library.noCollections")}
                          </span>
                        )}
                      </>
                    )}
                  </Fragment>
                </div>
              </div>
            )}
          </div>
        </Container>
        <TabBar />
      </div>
      <CreateCollectionModal
        isOpen={displayCreateCollectionModal}
        onClose={() => setDisplayCreateCollectionModal(false)}
        onSubmit={async (payload) => {
          try {
            await createCollection(payload);
            await retrieveLibrary(libraryData?.id ?? 0);

            toast.success("Collection created successfully.", {
              style: {
                backgroundColor: "#111827",
                color: "#fff",
              },
              position: "bottom-right",
            });

            setDisplayCreateCollectionModal(false);
            return true;
          } catch (err) {
            console.error(err);
            toast.error("Failed to create collection.", {
              style: {
                backgroundColor: "#111827",
                color: "#fff",
              },
              position: "bottom-right",
            });
            return false;
          }
        }}
        libraryId={libraryData?.id ?? 0}
      />
    </>
  );
}
