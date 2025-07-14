import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { toast } from "react-toastify";
import { ArrowPathIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/solid";

import Button from "../components/atoms/Button";
import ServerConnect from "../components/organisms/common/ServerConnect";
import { TabBar } from "../components/organisms/common/TabBar";
import { CreateLibraryModal } from "../components/organisms/libraries/CreateLibraryModal";
import { Container } from "../components/templates/Container";
import { Library, useLibrary } from "../hooks/useLibrary";
import { useCommonStore } from "../store/common";
import { useLibraryStore } from "../store/library";
import { EditLibraryModal } from "../components/organisms/libraries/EditLibraryModal";

const LibraryCard = memo(
  ({
    library,
    server,
    onNavigate,
    setEditLibraryId,
    setDisplayEditModal,
  }: {
    library: Library;
    server: string;
    onNavigate: (id: string) => void;
    setEditLibraryId: (id: number) => void;
    setDisplayEditModal: (display: boolean) => void;
  }) => {
    return (
      <button
        key={library.id}
        className="hover:cursor-pointer relative"
        aria-label={`Go to ${library.name}`}
        onClick={() => onNavigate(library.id.toString())}
      >
        <div className="absolute top-1 right-1 flex flex-row items-center justify-center">
          <div className="h-[2.5rem] w-auto px-[1rem] flex items-center justify-center rounded-full bg-black/75 text-white text-sm font-semibold">
            {library.seriesCount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="absolute top-1 left-1 flex flex-row items-center justify-center">
          <button
            className="rounded-full bg-black/75 text-white text-sm font-semibold h-[2.5rem] w-[2.5rem] flex items-center justify-center hover:cursor-pointer transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              setEditLibraryId(library.id);
              setDisplayEditModal(true);
            }}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full bg-tertiary rounded-t-xl h-[16rem] flex flex-row">
          {library.series?.map((series, idx) => (
            <div className="w-1/3" key={series.id}>
              <img
                src={`${server}/cover-image/${library.id}/${series.id}.webp`}
                // @ts-ignore
                alt={library.type === "book" ? series.title : series.name}
                className={`w-full h-full object-cover ${
                  idx === 0 ? "rounded-tl-xl" : idx === 2 ? "rounded-tr-xl" : ""
                }`}
              />
            </div>
          ))}
        </div>
        <div className="bg-primary text-white p-5 rounded-b-xl w-full mx-auto font-semibold">
          {library.name}
        </div>
      </button>
    );
  }
);

const LocalLibraries = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openLocalFile } = useLibrary();

  return (
    <>
      <Button onPress={() => navigate("/library/9999?local=book")}>
        {t("libraries.viewOfflineBooks")}
      </Button>
      <Button onPress={() => navigate("/library/9998?local=manga")}>
        {t("libraries.viewOfflineManga")}
      </Button>
      <Button onPress={() => openLocalFile()}>
        {t("libraries.openLocalFile")}
      </Button>
    </>
  );
});

export default function LibrariesScreen() {
  const { server, isConnected } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
      isConnected: state.isConnected,
    }))
  );
  const { librariesData, setLibraryId, recentlyRead } = useLibraryStore(
    useShallow((state) => ({
      librariesData: state.librariesData,
      recentlyRead: state.recentlyRead,
      setLibraryId: state.setLibraryId,
    }))
  );

  const { retrieveLibraries, createLibrary, retrieveLibrary } = useLibrary();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [displayModal, setDisplayModal] = useState(false);
  const [displayEditModal, setDisplayEditModal] = useState(false);
  const [editLibraryId, setEditLibraryId] = useState<number | null>(null);

  const handleNavigate = useCallback(
    async (libraryId: string) => {
      if (!librariesData) {
        return null;
      }

      setLibraryId(Number(libraryId));
      retrieveLibrary(Number(libraryId));
      navigate(`/library/${libraryId}`);
    },
    [navigate]
  );

  const isMobile = useMemo(
    () => import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile",
    []
  );

  useEffect(() => {
    retrieveLibraries();
  }, []);

  return (
    <>
      <div className="h-screen flex flex-col bg-secondary">
        <Container className="flex-1 px-5 pb-24 pt-12">
          <div className="flex flex-col md:flex-row gap-2 mb-5 mt-[1rem] md:mt-0">
            {isMobile && <LocalLibraries />}
            <Button
              className="ml-auto mr-0 rounded-full w-full md:w-auto px-2 py-1"
              onPress={() => {
                retrieveLibraries();
                toast.success(t("toast.librariesRefreshed"), {
                  style: {
                    backgroundColor: "#111827",
                    color: "#fff",
                  },
                  position: "bottom-right",
                });
              }}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center mb-[4rem]">
            {!isConnected ? (
              <div>
                <div className="text-white">{t("libraries.pleaseConnect")}</div>
                <div className="w-full mt-5">
                  <ServerConnect />
                </div>
              </div>
            ) : (
              <>
                <div className="w-full">
                  <div className="flex flex-row gap-2">
                    <h1 className="text-2xl text-white font-bold">
                      Recently read
                    </h1>
                  </div>
                  <div className="w-full flex flex-row overflow-x-auto gap-5 my-5">
                    {recentlyRead &&
                      (recentlyRead as unknown as any[]).map((item) => (
                        <button
                          className="min-w-[calc(50%-0.625rem)] md:min-w-[8rem] md:w-[8rem] hover:cursor-pointer"
                          onClick={() => {
                            let url: null | string = null;

                            const library = (
                              librariesData as unknown as Library[]
                            )?.find((l) => l.id === item.library_id);

                            if (!library) {
                              return;
                            }

                            if (library.type === "book") {
                              url = `/book/${item.series_id}/read`;
                            } else {
                              url = `/manga/${item.file_id}/read`;
                            }

                            navigate(url);
                          }}
                        >
                          <img
                            src={`${server}/cover-image/${item.library_id}/${item.series_id}.webp`}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </button>
                      ))}
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex flex-row gap-2">
                    <h1 className="text-2xl text-white font-bold">
                      {isMobile
                        ? t("libraries.remote")
                        : t("libraries.general")}
                    </h1>
                    <Button
                      className={styles.button}
                      onPress={() => setDisplayModal(true)}
                    >
                      <PlusIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full mt-5">
                    {librariesData &&
                      (librariesData as Library[]).map((library: Library) => (
                        <LibraryCard
                          key={library.id}
                          library={library}
                          server={server}
                          onNavigate={handleNavigate}
                          setEditLibraryId={setEditLibraryId}
                          setDisplayEditModal={setDisplayEditModal}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Container>
        <TabBar />
      </div>
      <CreateLibraryModal
        isOpen={displayModal}
        onClose={() => setDisplayModal(false)}
        onSubmit={createLibrary}
      />
      {librariesData && displayEditModal && editLibraryId && (
        <EditLibraryModal
          library={
            (librariesData as unknown as Library[])?.find(
              (l) => l.id === editLibraryId
            ) as Library
          }
          isOpen={displayEditModal}
          onClose={() => {
            setDisplayEditModal(false);
            setEditLibraryId(null);
          }}
        />
      )}
    </>
  );
}

const styles = {
  button: "px-2 py-1 rounded-full",
};
