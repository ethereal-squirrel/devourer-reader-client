import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function useDeepLink() {
  const navigation = useNavigate();

  useEffect(() => {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "web") {
      return;
    }

    const setupDeepLink = async () => {
      try {
        await onOpenUrl((urls) => {
          console.log("Deep link received:", urls);
          let url = urls[0].split("://")[1];
          url = url.replace("open/", "");
          console.log("Deep link:", url);
          navigation(url);
        });
        console.log("Deep link handler registered successfully");
      } catch (error) {
        console.error("Failed to setup deep link handler:", error);
      }
    };

    setupDeepLink();
  }, []);
}
