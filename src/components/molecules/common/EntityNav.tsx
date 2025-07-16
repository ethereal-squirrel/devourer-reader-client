import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import {
  ArrowDownOnSquareIcon,
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

import Button from "../../atoms/Button";
import { AddToCollectionModal } from "../../organisms/common/AddToCollectionModal";
import { Book, useBook } from "../../../hooks/useBook";
import { useLibrary } from "../../../hooks/useLibrary";
import { Series, useManga } from "../../../hooks/useManga";
import { useAuthStore } from "../../../store/auth";
import { useCommonStore } from "../../../store/common";

export default function EntityNav({
  type,
  entity,
  libraryId,
  offlineAvailability,
  isLocal,
  localServer,
}: {
  type: "book" | "series";
  entity: Book | Series;
  libraryId: number;
  offlineAvailability: boolean;
  isLocal?: boolean;
  localServer?: string | null;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { roles } = useAuthStore(
    useShallow((state) => ({
      roles: state.roles,
    }))
  );
  const { retrieveLibrary } = useLibrary();
  const { makeBookAvailableOffline, makeBookUnavailableOffline } = useBook();
  const popupRef = useRef<HTMLDivElement>(null);
  const { makeSeriesAvailableOffline, makeSeriesUnavailableOffline } =
    useManga();
  const [displayMoreOptions, setDisplayMoreOptions] = useState(false);
  const [displayAddToCollectionModal, setDisplayAddToCollectionModal] =
    useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        displayMoreOptions &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setDisplayMoreOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [displayMoreOptions]);

  const getTitle = () => {
    if (!entity) {
      return "";
    }

    if ((entity as Series).manga_data && (entity as Series).manga_data.title) {
      return (entity as Series).manga_data.title;
    }

    if ((entity as Series).manga_data && (entity as Series).manga_data.titles) {
      const englishTitle = (entity as Series).manga_data.titles.find(
        (title: { type: string; title: string }) => title.type === "English"
      );

      if (englishTitle) {
        return englishTitle.title;
      }

      const defaultTitle = (entity as Series).manga_data.titles.find(
        (title: { type: string; title: string }) => title.type === "Default"
      );

      if (defaultTitle) {
        return defaultTitle.title;
      }
    }

    return (entity as Series).title;
  };

  if (!entity) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between items-start mb-[1rem] gap-3">
        <div className="flex flex-row gap-3 md:gap-2 w-full md:max-w-[calc(100vw-20rem)] items-start md:items-center">
          <Button
            aria-label={t("common.returnToLibrary")}
            onPress={() => {
              if (isLocal) {
                navigate(
                  type === "book"
                    ? "/library/9999?local=book"
                    : "/library/9998?local=manga"
                );
              } else {
                navigate(`/library/${libraryId}`);
              }
            }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-bold text-start text-xl text-white">
              {type === "book" ? (
                <>
                  {(entity as Book).metadata.title
                    ? (entity as Book).metadata.title
                    : (entity as Book).title}
                </>
              ) : (
                <>{getTitle()}</>
              )}
            </h1>
            {type === "book" && (
              <>
                {(entity as Book).metadata.subtitle &&
                  (entity as Book).metadata.subtitle.length > 0 && (
                    <div className="text-[16px] text-white">
                      {(entity as Book).metadata.subtitle}
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
        <div className="relative w-full md:w-auto">
          <div
            ref={popupRef}
            className="w-full md:absolute md:top-0 md:-left-[17.5rem] md:w-[17.5rem] bg-[#090D16] rounded-lg text-white md:mb-[1rem]"
            style={{
              zIndex: 1000,
            }}
          >
            <button
              className="flex flex-row w-full justify-center items-center gap-3 p-3"
              onClick={() => {
                setDisplayMoreOptions(!displayMoreOptions);
              }}
            >
              {displayMoreOptions ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
              <span>
                {displayMoreOptions ? "Hide actions" : "View actions"}
              </span>
            </button>
            {displayMoreOptions && (
              <div className="mt-[0.5rem] p-3 pt-0">
                {roles.edit_metadata && (
                  <Button
                    className="w-full"
                    onPress={() => {
                      navigate(
                        type === "book"
                          ? `/book/${
                              isLocal
                                ? (entity as Book).file_id
                                : (entity as Book).id
                            }/metadata${isLocal ? "?local=book" : ""}${
                              localServer ? `&localServer=${localServer}` : ""
                            }`
                          : `/manga/${
                              isLocal
                                ? (entity as Series).series_id
                                : (entity as Series).id
                            }/metadata${isLocal ? "?local=manga" : ""}${
                              localServer ? `&localServer=${localServer}` : ""
                            }`
                      );
                    }}
                  >
                    <PencilIcon className="w-4 h-4" />
                    {t("common.editMetadata")}
                  </Button>
                )}
                {!isLocal && (
                  <Button
                    className="mt-[0.5rem] w-full"
                    onPress={() => {
                      setDisplayAddToCollectionModal(true);
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t("common.addToCollection")}
                  </Button>
                )}
                <Button
                  className="mt-[0.5rem] w-full"
                  onPress={async () => {
                    if (isLocal) {
                      if (type === "book") {
                        await makeBookUnavailableOffline({
                          id: (entity as Book).file_id,
                          server: localServer || "",
                        });
                      } else {
                        await makeSeriesUnavailableOffline(entity as Series);
                      }

                      navigate(`/libraries`);
                    } else {
                      if (offlineAvailability) {
                        if (type === "book") {
                          await makeBookUnavailableOffline({
                            id: (entity as Book).id,
                            server,
                          });
                        } else {
                          await makeSeriesUnavailableOffline(entity as Series);
                        }
                      } else {
                        if (type === "book") {
                          await makeBookAvailableOffline(entity as Book);
                        } else {
                          await makeSeriesAvailableOffline(entity as Series);
                        }
                      }

                      await retrieveLibrary(libraryId);
                    }
                  }}
                >
                  <ArrowDownOnSquareIcon className="w-4 h-4" />
                  {isLocal || offlineAvailability
                    ? t("common.makeUnavailableOffline")
                    : t("common.makeAvailableOffline")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AddToCollectionModal
        entityId={entity.id}
        displayModal={displayAddToCollectionModal}
        setDisplayModal={setDisplayAddToCollectionModal}
      />
    </>
  );
}
