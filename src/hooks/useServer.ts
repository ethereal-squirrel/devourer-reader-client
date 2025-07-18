import { useCallback, useEffect, useState } from "react";
import { load } from "@tauri-apps/plugin-store";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useLibrary } from "./useLibrary";
import { useRequest } from "./useRequest";
import { useCommonStore } from "../store/common";
import { useAuthStore } from "../store/auth";
import { ask } from "@tauri-apps/plugin-dialog";

export function useServer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { makeRequest } = useRequest();
  const {
    server,
    setServer,
    setActiveTab,
    setIsConnected,
    setServerVersion,
    setUsers,
  } = useCommonStore(
    useShallow((state) => ({
      setActiveTab: state.setActiveTab,
      server: state.server,
      setServer: state.setServer,
      setIsConnected: state.setIsConnected,
      setServerVersion: state.setServerVersion,
      setUsers: state.setUsers,
    }))
  );
  const { apiKey, setApiKey, setDisplayAuthModal, setRoles, setUsername } =
    useAuthStore(
      useShallow((state) => ({
        apiKey: state.apiKey,
        setApiKey: state.setApiKey,
        setDisplayAuthModal: state.setDisplayAuthModal,
        setRoles: state.setRoles,
        setUsername: state.setUsername,
      }))
    );
  const { retrieveLibraries, getRoles } = useLibrary();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const libraryRetrieval = useCallback(
    async (trimmedServer: string) => {
      try {
        const status = await retrieveLibraries(trimmedServer);

        if (status) {
          try {
            const response = await fetch(`${trimmedServer}/version`);
            const json = await response.json();

            setServerVersion(json.version);
          } catch (error) {
            setServerVersion("0.0.1");
            console.error("Server version retrieval error:", error);
          }

          try {
            const response = await getRoles(trimmedServer);
            setRoles(response.roles);
            setUsername(response.username);
          } catch (error) {
            console.error("Server roles retrieval error:", error);
          }

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

  const getUsers = useCallback(async () => {
    const response = await makeRequest("/users", "GET");

    if (!response.status) {
      throw new Error("Failed to fetch users");
    }

    setUsers(response.users);
  }, [makeRequest, setUsers]);

  const createUser = useCallback(
    async (username: string, password: string, role: string) => {
      const response = await makeRequest("/users", "POST", {
        username,
        password,
        role,
      });

      if (!response.status) {
        throw new Error("Failed to create user");
      }

      return true;
    },
    [makeRequest]
  );

  const editUser = useCallback(
    async (userId: number, role: string, password?: string) => {
      const response = await makeRequest(`/user/${userId}`, "PATCH", {
        role,
        password,
      });

      if (!response.status) {
        throw new Error("Failed to edit user");
      }

      return true;
    },
    [makeRequest]
  );

  const deleteUser = useCallback(
    async (userId: number) => {
      const answer = await ask("Are you sure you want to delete this user?", {
        title: "Devourer",
        kind: "warning",
      });

      if (answer) {
        const response = await makeRequest(`/user/${userId}`, "DELETE");

        if (!response.status) {
          toast.error("Failed to delete user.", {
            style: {
              backgroundColor: "#111827",
              color: "#fff",
            },
            position: "bottom-right",
          });

          throw new Error("Failed to delete user");
        }

        toast.success("User successfully deleted.", {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
          position: "bottom-right",
        });

        await getUsers();

        return true;
      } else {
        return false;
      }
    },
    [makeRequest, getUsers]
  );

  return {
    connectToServer,
    loading,
    error,
    getUsers,
    createUser,
    deleteUser,
    editUser,
  };
}
