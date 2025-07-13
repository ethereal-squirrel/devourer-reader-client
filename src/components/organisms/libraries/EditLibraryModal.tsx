import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useCallback, memo } from "react";

import { Library, useLibrary } from "../../../hooks/useLibrary";
import Button from "../../atoms/Button";
import { ask } from "@tauri-apps/plugin-dialog";

const metadataProviders = {
  book: [
    {
      label: "Google Books",
      value: "googlebooks",
      keyRequired: false,
    },
    {
      label: "OpenLibrary",
      value: "openlibrary",
      keyRequired: false,
    },
  ],
  manga: [
    {
      label: "ComicVine",
      value: "comicvine",
      keyRequired: true,
    },
    {
      label: "Jikan (MyAnimeList)",
      value: "myanimelist",
      keyRequired: false,
    },
  ],
};

export const EditLibraryModal = memo(
  ({
    library,
    isOpen,
    onClose,
  }: {
    library: Library;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const { t } = useTranslation();
    const { retrieveLibrary, updateLibrary, retrieveLibraries, deleteLibrary } =
      useLibrary();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payload, setPayload] = useState<Library>(library);

    const handleSubmit = useCallback(async () => {
      if (payload.name && payload.name.length === 0) {
        setError(t("libraries.createErrorName"));
        return;
      }
      if (payload.path && payload.path.length === 0) {
        setError(t("libraries.createErrorPath"));
        return;
      }

      if (
        payload.metadata?.provider === "comicvine" &&
        (!payload.metadata?.apiKey || payload.metadata?.apiKey.length === 0)
      ) {
        setError(t("libraries.createErrorApiKey"));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await updateLibrary(library.id, {
          metadata: payload.metadata,
          name: payload.name,
          path: payload.path,
        });
        await retrieveLibrary(library.id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }, [payload, library, onClose, t]);

    const handleDelete = useCallback(async () => {
      const answer = await ask(
        "Are you sure you want to delete this library? This action cannot be done, and will leave the the files on your filesystem.",
        {
          title: "Devourer",
          kind: "warning",
        }
      );

      if (answer) {
        await deleteLibrary(library.id);
        await retrieveLibraries();
        onClose();
      }
    }, [library, onClose]);

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
              <DialogTitle as="h3" className="font-semibold text-2xl">
                {t("libraries.editRemoteLibrary")}
              </DialogTitle>
              <div className="mt-5">
                <label htmlFor="name" className="font-semibold">
                  {t("libraries.name")}
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.name}
                  onChange={(e) =>
                    setPayload({ ...payload, name: e.target.value })
                  }
                />
                <label htmlFor="path" className="font-semibold">
                  {t("libraries.path")}{" "}
                  <span className="text-xs text-gray-500">
                    <br />
                    {t("libraries.editPathInfo")}
                  </span>
                </label>
                <input
                  type="text"
                  id="path"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.path}
                  onChange={(e) =>
                    setPayload({ ...payload, path: e.target.value })
                  }
                />
                <label htmlFor="type" className="font-semibold">
                  {t("libraries.metadataProvider")}
                </label>
                <select
                  id="metadataProvider"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.metadata?.provider}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      metadata: {
                        ...payload.metadata,
                        provider: e.target.value as
                          | "myanimelist"
                          | "googlebooks"
                          | "devourer"
                          | "comicvine"
                          | "openlibrary",
                      },
                    })
                  }
                >
                  {metadataProviders[payload.type].map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
                {metadataProviders[payload.type].find(
                  (provider) => provider.value === payload.metadata?.provider
                )?.keyRequired && (
                  <>
                    <label htmlFor="path" className="font-semibold">
                      {t("libraries.metadataApiKey")}
                    </label>
                    <input
                      type="text"
                      id="path"
                      className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                      value={payload.metadata?.apiKey}
                      onChange={(e) =>
                        setPayload({
                          ...payload,
                          metadata: {
                            ...payload.metadata,
                            apiKey: e.target.value,
                          },
                        })
                      }
                    />
                  </>
                )}
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
              <div>
                <Button
                  className="w-full"
                  disabled={loading}
                  onPress={handleSubmit}
                >
                  {t("libraries.editLibrary")}
                </Button>
              </div>
              <div className="mt-2">
                <Button
                  className="w-full"
                  disabled={loading}
                  onPress={handleDelete}
                >
                  {t("libraries.deleteLibrary")}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
