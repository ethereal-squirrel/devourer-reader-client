import { useTranslation } from "react-i18next";
import { PlusIcon } from "@heroicons/react/24/solid";

import Button from "../../atoms/Button";
import { useLibrary } from "../../../hooks/useLibrary";
import { useEffect } from "react";

export default function Actions({
  activeTab,
  setActiveTab,
  isLocal,
  setDisplayCreateCollectionModal,
  libraryId,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLocal?: boolean;
  setDisplayCreateCollectionModal: (display: boolean) => void;
  libraryId: number;
}) {
  const { t } = useTranslation();
  const { scanLibrary, scanStatus, getScanStatus } = useLibrary();

  useEffect(() => {
    if (libraryId && getScanStatus) {
      getScanStatus(libraryId);

      const interval = setInterval(() => {
        getScanStatus(libraryId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [libraryId]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 mt-5">
      <div className="flex flex-col md:flex-row items-center gap-2 w-full">
        <button
          onClick={() => setActiveTab("files")}
          className={`w-full md:w-auto flex flex-row gap-2 ${
            activeTab === "files" ? "bg-quaternary" : "bg-primary"
          } ${styles.button}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
          {t("library.files")}
        </button>
        {!isLocal && (
          <button
            onClick={() => setActiveTab("collections")}
            className={`w-full md:w-auto flex flex-row gap-2 ${
              activeTab === "collections" ? "bg-quaternary" : "bg-primary"
            } ${styles.button}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
              />
            </svg>
            {t("library.collections")}
          </button>
        )}
        {activeTab === "collections" && (
          <Button
            onPress={() => setDisplayCreateCollectionModal(true)}
            className="flex flex-row gap-2 ml-auto mr-0"
          >
            <PlusIcon className="size-4" />
            {t("library.createCollection")}
          </Button>
        )}
      </div>
      <div className="w-full md:w-auto">
        <Button
          onPress={async () => {
            scanLibrary(libraryId);
            await new Promise((resolve) => setTimeout(resolve, 100));
            getScanStatus(libraryId);
          }}
          className="w-full md:w-[12rem]"
          disabled={
            scanStatus &&
            scanStatus.remaining &&
            scanStatus.remaining.length > 0
          }
        >
          {scanStatus && scanStatus.remaining && scanStatus.remaining.length > 0
            ? t("library.scanInProgress")
            : t("library.scan")}
        </Button>
      </div>
    </div>
  );
}

const styles = {
  button: "text-white px-5 py-3 rounded-xl font-semibold hover:cursor-pointer",
};
