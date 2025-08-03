import { useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { useLibraryStore } from "../../../store/library";
import { useLibrary } from "../../../hooks/useLibrary";
import { useRequest } from "../../../hooks/useRequest";

export const UploadBookModal = memo(
  ({
    isOpen,
    onClose,
    libraryId,
  }: {
    isOpen: boolean;
    onClose: () => void;
    libraryId: number;
  }) => {
    const { t } = useTranslation();
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData,
      }))
    ) as any;
    const { retrieveLibrary } = useLibrary();
    const { makeRequest } = useRequest();
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async () => {
      if (!file) {
        setError(t("libraries.createErrorFile"));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { status, message } = await makeRequest(
          `/book/${libraryId}`,
          "PUT",
          undefined,
          undefined,
          undefined,
          file
        );

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
    }, [file, onClose, t, libraryData]);

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
                  Upload book
                </DialogTitle>
                <button className="hover:cursor-pointer" onClick={onClose}>
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="mt-5">
                <label htmlFor="file" className="font-semibold">
                  File
                </label>
                <input
                  type="file"
                  id="file"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  multiple={false}
                  onChange={(e) => {
                    const validExtensions = ["epub", "pdf"];

                    if (
                      e.target.files &&
                      e.target.files.length > 0 &&
                      validExtensions.includes(
                        e.target.files[0].name.split(".").pop()!
                      )
                    ) {
                      setFile(e.target.files[0]);
                    } else {
                      setError("File must be an epub or pdf.");
                    }
                  }}
                />
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
                  Upload book
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
