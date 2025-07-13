import { useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export const CreateCollectionModal = memo(
  ({
    isOpen,
    onClose,
    onSubmit,
    libraryId,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: any) => Promise<boolean>;
    libraryId: number;
  }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payload, setPayload] = useState<any>({
      title: "",
      libraryId,
    });

    const handleSubmit = useCallback(async () => {
      if (!payload.title || payload.title.length === 0) {
        setError(t("library.collectionValidation"));
        return;
      }

      if (loading) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const outcome = await onSubmit(payload);

        if (outcome) {
          setPayload({
            title: "",
            libraryId,
          });
          setError(null);
          setLoading(false);
          onClose();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }, [payload, libraryId, onSubmit, onClose, t]);

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
                {t("library.createCollection")}
              </DialogTitle>
              <div className="mt-5">
                <label htmlFor="name" className="font-semibold">
                  {t("libraries.name")}
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.title}
                  onChange={(e) =>
                    setPayload({ ...payload, title: e.target.value })
                  }
                />
              </div>
              {error && (
                <div
                  className="mb-5 p-2 bg-red-900/50 rounded-md text-white"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                >
                  {error}
                </div>
              )}
              <div>
                <button
                  className={`bg-secondary hover:bg-tertiary text-white w-full p-3 rounded-md font-semibold hover:cursor-pointer ${
                    loading ? "opacity-50" : ""
                  }`}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {t("library.createCollection")}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
