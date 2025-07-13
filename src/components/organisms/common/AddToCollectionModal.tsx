import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";

import Button from "../../atoms/Button";
import { Library, useLibrary } from "../../../hooks/useLibrary";
import { useLibraryStore } from "../../../store/library";

export const AddToCollectionModal = memo(
  ({
    entityId,
    displayModal,
    setDisplayModal,
  }: {
    entityId: number;
    displayModal: boolean;
    setDisplayModal: (displayModal: boolean) => void;
  }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [collectionId, setCollectionId] = useState<number>(0);
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData as unknown as Library,
      }))
    );
    const { addToCollection, retrieveLibrary } = useLibrary();

    const handleSubmit = useCallback(async () => {
      if (collectionId === 0) {
        return;
      }

      setLoading(true);

      try {
        const outcome = await addToCollection(collectionId, entityId);

        if (outcome) {
          setDisplayModal(false);
          await retrieveLibrary(libraryData.id);

          toast.success(t("common.addToCollectionSuccess"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });
        }
      } catch (error) {
        toast.error(t("common.addToCollectionError"), {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
          position: "bottom-right",
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, [collectionId, t]);

    return (
      <Dialog
        open={displayModal}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={() => setDisplayModal(false)}
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
                {t("common.addToCollection")}
              </DialogTitle>
              <div className="mt-5">
                <label htmlFor="type" className="font-semibold">
                  {t("common.collection")}
                </label>
                <select
                  id="collectionId"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={collectionId}
                  onChange={(e) => {
                    setCollectionId(Number(e.target.value));
                  }}
                >
                  <option value="0">{t("common.selectCollection")}</option>
                  {libraryData.collections?.map((collection: any) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Button
                  className="w-full"
                  disabled={loading || collectionId === 0}
                  onPress={handleSubmit}
                >
                  {t("common.addToCollection")}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
