import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useCallback, memo } from "react";
import { toast } from "react-toastify";
import { XMarkIcon } from "@heroicons/react/24/solid";

import Button from "../../atoms/Button";
import { useShared } from "../../../hooks/useShared";

export const SendToKindleModal = memo(
  ({
    libraryId,
    entityId,
    displayModal,
    setDisplayModal,
    fileName,
  }: {
    libraryId: number;
    entityId: number;
    displayModal: boolean;
    setDisplayModal: (displayModal: boolean) => void;
    fileName: string;
  }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const { sendToKindle } = useShared();
    const [email, setEmail] = useState<string>("");

    const handleSubmit = useCallback(async () => {
      if (!email.includes("@")) {
        return;
      }

      setLoading(true);

      try {
        const { status, message } = await sendToKindle(
          libraryId,
          entityId,
          email,
          fileName
        );

        if (status) {
          setEmail("");
          setDisplayModal(false);

          toast.success(t("common.sendToKindleSuccess"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
              zIndex: 99999,
            },
            position: "bottom-right",
          });
        } else {
          toast.error(message, {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
              zIndex: 99999,
            },
          });
        }
      } catch (error) {
        toast.error(t("common.sendToKindleError"), {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
            zIndex: 99999,
          },
          position: "bottom-right",
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, [email, libraryId, entityId, t]);

    return (
      <Dialog
        open={displayModal}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={() => setDisplayModal(false)}
        style={{
          zIndex: 90000,
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
                  {t("common.sendToKindle")}
                </DialogTitle>
                <button
                  className="hover:cursor-pointer"
                  onClick={() => setDisplayModal(false)}
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-5">
                {t("common.kindleDescription")}
              </p>
              <div className="mt-5">
                <label htmlFor="type" className="font-semibold">
                  {t("common.kindleEmail")}
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={email}
                  maxLength={32}
                  onChange={(e) => {
                    setEmail(e.target.value);
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
                  disabled={loading || !email.includes("@")}
                  onPress={handleSubmit}
                >
                  {t("common.sendToKindle")}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
