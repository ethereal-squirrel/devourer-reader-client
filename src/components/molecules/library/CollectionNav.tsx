import { useNavigate } from "react-router";
import { ask } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

import Button from "../../atoms/Button";
import { useLibrary } from "../../../hooks/useLibrary";

export default function CollectionNav({
  collectionId,
  libraryId,
  name,
}: {
  collectionId: number;
  libraryId: number;
  name: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const { deleteCollection, retrieveLibrary } = useLibrary();

  return (
    <div className="flex flex-col md:flex-row md:justify-between items-center mb-[1rem] gap-3">
      <div className="flex flex-row gap-3 md:gap-2 w-full md:w-auto items-center">
        <Button
          aria-label={t("common.returnToLibrary")}
          onPress={() => {
            navigate(`/library/${libraryId}?tab=collections`);
          }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-bold text-start text-xl text-white">{name}</h1>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <Button
          onPress={async () => {
            if (loading) {
              return;
            }
            const answer = await ask(
              t("collection.deleteCollectionConfirmation"),
              {
                title: "Devourer",
                kind: "warning",
              }
            );

            if (answer) {
              setLoading(true);

              try {
                const outcome = await deleteCollection(collectionId);

                if (outcome) {
                  toast.success(t("collection.collectionDeleted"), {
                    style: {
                      backgroundColor: "#111827",
                      color: "#fff",
                    },
                    position: "bottom-right",
                  });

                  await retrieveLibrary(libraryId);
                  navigate(`/library/${libraryId}?tab=collections`);
                } else {
                  toast.error(t("collection.collectionDeleteError"), {
                    style: {
                      backgroundColor: "#111827",
                      color: "#fff",
                    },
                    position: "bottom-right",
                  });
                }
              } catch (error) {
                console.error(error);
                setLoading(false);
              }
            }
          }}
          disabled={loading}
        >
          <TrashIcon className="w-4 h-4" />
          {t("collection.deleteCollection")}
        </Button>
      </div>
    </div>
  );
}
