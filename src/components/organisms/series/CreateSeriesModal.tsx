import { useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { useLibraryStore } from "../../../store/library";
import { useLibrary } from "../../../hooks/useLibrary";
import { useRequest } from "../../../hooks/useRequest";

export const CreateSeriesModal = memo(
  ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { t } = useTranslation();
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData,
      }))
    ) as any;
    const { retrieveLibrary } = useLibrary();
    const { makeRequest } = useRequest();
    const [error, setError] = useState<string | null>(null);
    const [series, setSeries] = useState<any>({
      title: "",
      path: "",
      library_id: libraryData.id,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async () => {
      if (series.title && series.title.length === 0) {
        setError(t("libraries.createErrorName"));
        return;
      }
      if (series.path && series.path.length === 0) {
        setError(t("libraries.createErrorPath"));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { status, message } = await makeRequest("/series", "PUT", {
          payload: series,
        });

        if (status) {
          await retrieveLibrary(libraryData.id);
          onClose();
        } else {
          setError(message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }, [series, onClose, t, libraryData]);

    return (
      <Dialog
        open={isOpen}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={onClose}
        style={{
          zIndex: 99999,
        }}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-black/85">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-gray-900 text-white p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
            >
              <div className="flex flex-row items-center justify-between">
                <DialogTitle as="h3" className="font-semibold text-2xl">
                  Create series
                </DialogTitle>
                <button className="hover:cursor-pointer" onClick={onClose}>
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="mt-5">
                <label htmlFor="name" className="font-semibold">
                  Series name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={series.title}
                  onChange={(e) =>
                    setSeries({ ...series, title: e.target.value })
                  }
                />
                <label htmlFor="path" className="font-semibold">
                  Folder name{" "}
                  <span className="text-xs">
                    (relative to library path e.g. "One Piece")
                  </span>
                </label>
                <input
                  type="text"
                  id="path"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={series.path}
                  onChange={(e) =>
                    setSeries({ ...series, path: e.target.value })
                  }
                />
              </div>
              <div>
                You will be able to edit metadata and add files to this series
                after creation.
              </div>
              {error && (
                <div
                  className="mt-5 p-2 bg-red-900/50 rounded-md text-white"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                >
                  {error}
                </div>
              )}
              <div className="mt-5">
                <button
                  className={`bg-secondary hover:bg-tertiary text-white w-full p-3 rounded-md font-semibold hover:cursor-pointer ${
                    loading ? "opacity-50" : ""
                  }`}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  Create series
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
