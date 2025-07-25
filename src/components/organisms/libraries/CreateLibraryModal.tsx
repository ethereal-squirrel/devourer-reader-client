import { useState, useCallback, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { ask } from "@tauri-apps/plugin-dialog";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { Library, useLibrary } from "../../../hooks/useLibrary";
import { useRequest } from "../../../hooks/useRequest";
import { useCommonStore } from "../../../store/common";

export const CreateLibraryModal = memo(
  ({
    isOpen,
    onClose,
    onSubmit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (library: any) => Promise<Library>;
  }) => {
    const { t } = useTranslation();
    const { importLibrary } = useLibrary();
    const { makeRequest } = useRequest();
    const { serverVersion } = useCommonStore(
      useShallow((state) => ({
        serverVersion: state.serverVersion,
      }))
    );
    const [error, setError] = useState<string | null>(null);
    const [isCalibreSupported, setIsCalibreSupported] = useState(false);
    const [library, setLibrary] = useState<Library>({
      id: 0,
      name: "",
      path: "",
      metadata: {
        provider: "myanimelist",
        apiKey: "",
      },
      type: "manga",
      series: [],
    });
    const [loading, setLoading] = useState(false);
    const [providers, setProviders] = useState<null | any>(null);

    useEffect(() => {
      if (!providers) {
        const getProviders = async () => {
          const { status, providers } = await makeRequest(
            "/metadata/providers",
            "GET"
          );

          if (status) {
            setProviders(Object.values(providers));
          }
        };

        getProviders();
      }
    }, [makeRequest]);

    useEffect(() => {
      if (serverVersion && serverVersion >= "1.1.0") {
        setIsCalibreSupported(true);
      } else {
        setIsCalibreSupported(false);
      }
    }, [serverVersion]);

    const handleSubmit = useCallback(async () => {
      if (library.name && library.name.length === 0) {
        setError(t("libraries.createErrorName"));
        return;
      }
      if (library.path && library.path.length === 0) {
        setError(t("libraries.createErrorPath"));
        return;
      }

      if (
        library.metadata?.provider === "comicvine" &&
        (!library.metadata?.apiKey || library.metadata?.apiKey.length === 0)
      ) {
        setError(t("libraries.createErrorApiKey"));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await onSubmit(library);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }, [library, onSubmit, onClose, t]);

    const handleImport = useCallback(async () => {
      if (
        !library.path ||
        library.path.length === 0 ||
        !library.name ||
        library.name.length === 0
      ) {
        setError(t("libraries.formFields"));
        return;
      }

      const answer = await ask(t("libraries.calibreAreYouSure"), {
        title: "Devourer",
        kind: "info",
      });

      if (answer) {
        const outcome = await importLibrary(library);

        if (outcome) {
          onClose();
        }
      }
    }, [library, onClose, t]);

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
                  {t("libraries.createRemoteLibrary")}
                </DialogTitle>
                <button className="hover:cursor-pointer" onClick={onClose}>
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="mt-5">
                <label htmlFor="name" className="font-semibold">
                  {t("libraries.name")}
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={library.name}
                  onChange={(e) =>
                    setLibrary({ ...library, name: e.target.value })
                  }
                />
                <label htmlFor="path" className="font-semibold">
                  {t("libraries.path")}
                </label>
                <input
                  type="text"
                  id="path"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={library.path}
                  onChange={(e) =>
                    setLibrary({ ...library, path: e.target.value })
                  }
                />
                <label htmlFor="type" className="font-semibold">
                  {t("libraries.type")}
                </label>
                <select
                  id="type"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={library.type}
                  onChange={(e) => {
                    if (e.target.value === "manga") {
                      setLibrary({
                        ...library,
                        metadata: {
                          provider: "myanimelist",
                          apiKey: "",
                        },
                        type: "manga",
                      });
                    } else if (e.target.value === "book") {
                      setLibrary({
                        ...library,
                        metadata: {
                          provider: "googlebooks",
                          apiKey: "",
                        },
                        type: "book",
                      });
                    }
                  }}
                >
                  <option value="manga">{t("common.manga")}</option>
                  <option value="book">{t("common.book")}</option>
                </select>
                <label htmlFor="type" className="font-semibold">
                  {t("libraries.metadataProvider")}
                </label>
                <select
                  id="metadataProvider"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={library.metadata?.provider}
                  onChange={(e) =>
                    setLibrary({
                      ...library,
                      metadata: {
                        ...library.metadata,
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
                  {providers &&
                    providers
                      .filter(
                        (provider: any) =>
                          provider.properties.library_type === library.type
                      )
                      .map((provider: any) => (
                        <option key={provider.key} value={provider.key}>
                          {provider.name}
                        </option>
                      ))}
                </select>
                {providers &&
                  providers.find(
                    (provider: any) =>
                      provider.key === library.metadata?.provider
                  )?.properties.key_required && (
                    <>
                      <label htmlFor="path" className="font-semibold">
                        {t("libraries.metadataApiKey")}
                      </label>
                      <input
                        type="text"
                        id="path"
                        className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                        value={library.metadata?.apiKey}
                        onChange={(e) =>
                          setLibrary({
                            ...library,
                            metadata: {
                              ...library.metadata,
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
              <div className="mt-5">
                <button
                  className={`bg-secondary hover:bg-tertiary text-white w-full p-3 rounded-md font-semibold hover:cursor-pointer ${
                    loading ? "opacity-50" : ""
                  }`}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {t("libraries.createLibrary")}
                </button>
              </div>
              {library.type === "book" && isCalibreSupported && (
                <>
                  <div className="mt-2">
                    <button
                      className={`bg-secondary hover:bg-tertiary text-white w-full p-3 rounded-md font-semibold hover:cursor-pointer ${
                        loading ? "opacity-50" : ""
                      }`}
                      disabled={loading}
                      onClick={handleImport}
                    >
                      {t("libraries.importFromCalibre")}
                    </button>
                  </div>
                  <div className="text-sm mt-2">
                    {t("libraries.importFromCalibreDescription")}
                  </div>
                </>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
