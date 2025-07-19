import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";

import { Book } from "./useBook";
import { Series } from "./useManga";
import { useRequest } from "./useRequest";
import { db } from "../lib/database";
import { getLocalImage } from "../lib/media";
import { useCommonStore } from "../store/common";

export function useShared() {
  const { t } = useTranslation();
  const [imagePath, setImagePath] = useState<string | null>(null);
  const { makeRequest } = useRequest();
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );

  const sendToKindle = async (
    libraryId: number,
    entityId: number,
    email: string,
    fileName: string
  ) => {
    try {
      const fileResponse = await fetch(
        `${server}/stream/${libraryId}/${entityId}`
      );

      const fileData = await fileResponse.blob();

      if (fileData.size > 39000000) {
        return { status: false, message: "File is too large." };
      }

      const formData = new FormData();
      formData.append("file", fileData, fileName);

      const response = await fetch(
        `https://kindle.devourer.app/send-to-kindle?email=${email}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.status) {
        return { status: true };
      }

      return { status: false, message: "Failed to send email." };
    } catch (error) {
      console.error("sendToKindle error:", error);
      return { status: false, message: "Failed to send email." };
    }
  };

  const pageEvent = async (
    page: number | string,
    isLocal: boolean,
    libraryId: number,
    fileId: number,
    localServer?: string
  ) => {
    try {
      if (isLocal && localServer) {
        if (libraryId === 9999) {
          await db.execute(
            "UPDATE BookFile SET current_page = ? WHERE file_id = ? AND server = ?",
            [page, fileId, localServer]
          );
        } else {
          await db.execute(
            "UPDATE MangaFile SET current_page = ? WHERE file_id = ? AND server = ?",
            [page, fileId, localServer]
          );
        }
      } else {
        makeRequest(`/file/page-event`, "POST", {
          libraryId,
          fileId,
          page,
        });
      }
    } catch (error) {
      console.error("pageEvent error:", error);
    }
  };

  const markAsRead = async (
    type: string,
    entityId: number,
    libraryId?: number
  ) => {
    if (libraryId) {
      const response = await makeRequest(
        `/${type}/${libraryId}/${entityId}/mark-as-read`,
        "POST"
      );

      if (!response.status) {
        throw new Error("Failed to update page");
      }

      return true;
    } else {
      //
    }
  };

  const getImagePath = async (
    type: "manga" | "book",
    entity: Book | Series,
    libraryId?: number,
    offline?: boolean
  ) => {
    if (offline) {
      const imagePath = await getLocalImage(
        type,
        type === "book"
          ? (entity as Book).file_id
          : (entity as Series).series_id,
        type === "manga" ? (entity as Series).id : undefined
      );

      if (imagePath) {
        setImagePath(imagePath);
      } else {
        setImagePath("");
      }
    } else {
      setImagePath(`${server}/cover-image/${libraryId}/${entity.id}.webp`);
    }
  };

  const updateMetadata = async (
    libraryId: number,
    entityId: number,
    data: any,
    isLocal?: boolean,
    localServer?: string
  ) => {
    try {
      if (isLocal) {
        if (libraryId === 9999) {
          await db.execute(
            "UPDATE BookFile SET metadata = ? WHERE file_id = ? AND server = ?",
            [JSON.stringify(data), entityId, localServer]
          );
        } else {
          await db.execute(
            "UPDATE MangaSeries SET manga_data = ? WHERE series_id = ? AND server = ?",
            [JSON.stringify(data), entityId, localServer]
          );
        }
      } else {
        const response = await makeRequest(
          `/series/${libraryId}/${entityId}/metadata`,
          "PATCH",
          { metadata: data }
        );

        if (!response) {
          toast.error(t("common.error"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });

          return false;
        }
      }

      toast.success(t("series.metadataSaved"), {
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
        position: "bottom-right",
      });

      return true;
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"), {
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
        position: "bottom-right",
      });
      return false;
    }
  };

  const rateEntity = async (
    libraryId: number,
    entityId: number,
    rating: number
  ) => {
    const response = await makeRequest(
      `/rate/${libraryId}/${entityId}`,
      "POST",
      { rating }
    );

    if (!response) {
      toast.error(t("common.error"), {
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
        position: "bottom-right",
      });

      return false;
    } else {
      return true;
    }
  };

  const addTag = async (libraryId: number, entityId: number, tag: string) => {
    const response = await makeRequest(
      `/tag/${libraryId}/${entityId}`,
      "POST",
      { tag }
    );

    if (!response) {
      toast.error(t("common.error"), {
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
        position: "bottom-right",
      });

      return false;
    } else {
      return true;
    }
  };

  const deleteTag = async (
    libraryId: number,
    entityId: number,
    tag: string
  ) => {
    const response = await makeRequest(
      `/tag/${libraryId}/${entityId}/${tag}`,
      "DELETE"
    );

    if (!response) {
      return false;
    } else {
      return true;
    }
  };

  return {
    markAsRead,
    getImagePath,
    imagePath,
    updateMetadata,
    pageEvent,
    rateEntity,
    addTag,
    deleteTag,
    sendToKindle,
  };
}
