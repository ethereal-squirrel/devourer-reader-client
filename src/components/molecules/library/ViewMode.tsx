import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { BookOpenIcon, TableCellsIcon } from "@heroicons/react/24/outline";

import { useUIStore } from "../../../store/ui";

export default function ViewMode() {
  const { t } = useTranslation();
  const { libraryViewMode, setLibraryViewMode } = useUIStore(
    useShallow((state) => ({
      libraryViewMode: state.libraryViewMode,
      setLibraryViewMode: state.setLibraryViewMode,
    }))
  );

  return (
    <div className="mt-5 flex flex-row gap-3 justify-end">
      <button
        className={`${
          libraryViewMode === "grid" ? "bg-quaternary" : "bg-primary"
        } px-3 py-1 rounded-lg text-xs text-white flex flex-row items-center gap-2 hover:cursor-pointer`}
        onClick={() => setLibraryViewMode("grid")}
      >
        <BookOpenIcon className="size-4" />
        {t("library.viewMode.grid")}
      </button>
      <button
        className={`${
          libraryViewMode === "table" ? "bg-quaternary" : "bg-primary"
        } px-3 py-1 rounded-lg text-xs text-white flex flex-row items-center gap-2 hover:cursor-pointer`}
        onClick={() => setLibraryViewMode("table")}
      >
        <TableCellsIcon className="size-4" />
        {t("library.viewMode.table")}
      </button>
    </div>
  );
}
