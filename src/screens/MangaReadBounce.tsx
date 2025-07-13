import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

export default function MangaReadBounce() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get("fileId");
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server");

  useEffect(() => {
    if (fileId) {
      navigate(
        `/manga/${fileId}/read${
          isLocal ? `?isLocal=true&server=${localServer}` : ""
        }`
      );
    }
  }, [fileId, isLocal, localServer, navigate]);

  return null;
}
