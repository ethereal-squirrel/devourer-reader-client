import { useCallback, useEffect, useState } from "react";
import { load } from "@tauri-apps/plugin-store";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useLibrary } from "./useLibrary";
import { useCommonStore } from "../store/common";
import { useAuthStore } from "../store/auth";

export function useServer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { server, setServer, setActiveTab, setIsConnected } = useCommonStore(
    useShallow((state) => ({
      setActiveTab: state.setActiveTab,
      server: state.server,
      setServer: state.setServer,
      setIsConnected: state.setIsConnected,
    }))
  );
  const { apiKey, setApiKey, setDisplayAuthModal } =
    useAuthStore(
      useShallow((state) => ({
        apiKey: state.apiKey,
        setApiKey: state.setApiKey,
        setDisplayAuthModal: state.setDisplayAuthModal
      }))
    );
  const { retrieveLibraries } = useLibrary();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const libraryRetrieval = useCallback(
    async (trimmedServer: string) => {
      try {
        const status = await retrieveLibraries(trimmedServer);

        if (status) {
          setDisplayAuthModal(false);
          setActiveTab("/libraries");
          setIsConnected(true);
          navigate("/libraries");

          return true;
        } else {
          toast.error(t("server.error"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });
          
          return false;
        }
      } catch (error) {
        console.error("Server connection error:", error);
        toast.error(t("server.error"), {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
          position: "bottom-right",
        });

        return false;
      } finally {
        setLoading(false);
      }
    },
    [retrieveLibraries, t, setActiveTab, setIsConnected, navigate, apiKey]
  );

  useEffect(() => {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "web") {
      const checkConnection = async () => {
        if (loading) {
          return;
        }

        setLoading(true);

        try {
          const url = window.location.href;
          const serverUrl =
            import.meta.env.VITE_PUBLIC_DEV_MODE === "1"
              ? "http://localhost:9024"
              : url.match(/^(https?:\/\/[^\/]+)/)?.[0];
          setServer(serverUrl || "");

          if (!serverUrl) {
            setError(true);
            return;
          }

          const status = await retrieveLibraries(serverUrl);
          setLoading(false);

          if (!status) {
            setError(true);
          }
        } catch (error) {
          console.error("Server connection error:", error);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      checkConnection();
    } else {
      setLoading(false);
    }
  }, [retrieveLibraries]);

  const connectToServer = useCallback(
    async (username?: string, password?: string) => {
      if (server === "" || loading) return;

      const trimmedServer = server.trim().replace(/\/$/, "");
      setServer(trimmedServer);
      setLoading(true);

      try {
        const health = await fetch(`${trimmedServer}/health`);

        if (health.status !== 200) {
          toast.error(t("server.error"), {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });
          setLoading(false);
          return false;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const safeServer = trimmedServer.replace(/[/:?&]/g, "_");
        const store = await load("store.json", { autoSave: false });

        const val = await store.get(`${safeServer}_apiKey`);

        if (val || (apiKey && apiKey.length > 0)) {
          const response = await fetch(`${trimmedServer}/status`, {
            headers: {
              Authorization: `Bearer ${val}`,
            },
          });

          setApiKey(val as unknown as string);
          await new Promise((resolve) => setTimeout(resolve, 50));

          if (response.status === 200) {
            const outcome = await libraryRetrieval(trimmedServer);
            return outcome;
          }
        }

        if (
          username &&
          username.length > 0 &&
          password &&
          password.length > 0
        ) {
          const response = await fetch(`${trimmedServer}/login`, {
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              username,
              password,
            }),
          });

          if (response.status === 200) {
            const json = await response.json();

            if (json.status && json.token) {
              setApiKey(json.token);
              await store.set(`${safeServer}_apiKey`, json.token);
              await store.save();

              await new Promise((resolve) => setTimeout(resolve, 50));
              const outcome = await libraryRetrieval(trimmedServer);
              setLoading(false);
              return outcome;
            }
          }
        }

        toast.error(
          "Failed to log in to server. Please check your credentials.",
          {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          }
        );
        setDisplayAuthModal(true);
        return false;
      } catch (error) {
        toast.error(t("server.error"), {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
          position: "bottom-right",
        });

        setDisplayAuthModal(true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      server,
      loading,
      setServer,
      t,
      setActiveTab,
      navigate,
      setDisplayAuthModal,
      libraryRetrieval,
    ]
  );

  return {
    connectToServer,
    loading,
    error,
  };
}
