import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";

import Button from "../../atoms/Button";
import { Library, useLibrary } from "../../../hooks/useLibrary";
import { useShared } from "../../../hooks/useShared";
import { useLibraryStore } from "../../../store/library";

export const ManageTagsModal = memo(
  ({
    libraryId,
    entityId,
    tags,
    displayModal,
    setDisplayModal,
  }: {
    libraryId: number;
    entityId: number;
    tags: string[];
    displayModal: boolean;
    setDisplayModal: (displayModal: boolean) => void;
  }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData as unknown as Library,
      }))
    );
    const { retrieveLibrary } = useLibrary();
    const { addTag, deleteTag } = useShared();
    const [tag, setTag] = useState<string>("");

    const handleSubmit = useCallback(async () => {
      if (tag.length < 3) {
        return;
      }

      setLoading(true);

      try {
        const outcome = await addTag(libraryId, entityId, tag);

        if (outcome) {
          await retrieveLibrary(libraryData.id);

          toast.success(t("common.addTagSuccess"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });
        }
      } catch (error) {
        toast.error(t("common.addTagError"), {
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
    }, [tag, libraryId, entityId, t]);

    const handleRemoveTag = useCallback(
      async (tag: string) => {
        const outcome = await deleteTag(libraryId, entityId, tag);

        if (outcome) {
          await retrieveLibrary(libraryData.id);
        } else {
          toast.error(t("common.deleteTagError"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });
        }
      },
      [tag, libraryId, entityId, t]
    );

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
              <div className="flex flex-row items-center justify-between">
                <DialogTitle as="h3" className="font-semibold text-2xl">
                  {t("common.manageTags")}
                </DialogTitle>
                <button
                  className="hover:cursor-pointer"
                  onClick={() => setDisplayModal(false)}
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="mt-5">
                <label htmlFor="type" className="font-semibold">
                  {t("common.tag")}
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={tag}
                  maxLength={32}
                  onChange={(e) => {
                    setTag(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <div>
                <Button
                  className="w-full"
                  disabled={loading || tag.length < 3}
                  onPress={handleSubmit}
                >
                  {t("common.addTag")}
                </Button>
              </div>
              <hr className="my-5" />
              <div
                className={`flex flex-row flex-wrap gap-2 ${
                  tags.length === 0 ? "hidden" : ""
                }`}
              >
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-primary text-white rounded-md px-2 py-1 text-sm font-semibold flex flex-row items-center gap-2"
                  >
                    {tag}
                    <button
                      className="bg-red-900 text-white rounded-md px-2 py-1 text-sm font-semibold hover:cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
