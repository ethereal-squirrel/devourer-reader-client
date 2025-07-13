import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { db } from "../lib/database";
import { useAuthStore } from "../store/auth";
import { useCommonStore } from "../store/common";

export function useRequest() {
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );

  const makeRequest = useCallback(
    async (
      path: string,
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      body?: any,
      cache?: boolean,
      host?: string
    ): Promise<any> => {
      if (!useAuthStore || useAuthStore.getState().apiKey.length === 0) {
        throw new Error("Unable to access authentication server");
      }

      if ((!host || host.length === 0) && (!server || server.length === 0)) {
        throw new Error("No server URL provided");
      }

      const fullUrl = host ? host + path : server + path;
      const safePath = fullUrl.replace(/[/:?&]/g, "_");

      try {
        const response = await fetch(fullUrl, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization:
              useAuthStore.getState().apiKey.length > 0
                ? `Bearer ${useAuthStore.getState().apiKey}`
                : "",
          },
          cache: "no-store",
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = null;

        try {
          data = await response.json();
        } catch (error) {
          return { status: false };
        }

        if (!data) {
          return { status: false };
        }

        if (cache) {
          await db.connect();
          await db.execute("DELETE FROM cache WHERE key = ?", [safePath]);
          await db.execute("INSERT INTO cache (key, value) VALUES (?, ?)", [
            safePath,
            JSON.stringify(data),
          ]);
        }

        return data;
      } catch (error) {
        if (cache) {
          await db.connect();
          const cachedData = await db.execute(
            "SELECT * FROM cache WHERE key = ?",
            [safePath]
          );

          if (cachedData && cachedData.length > 0) {
            return JSON.parse(cachedData[0].value);
          }
        }

        return { status: false };
      }
    },
    [server, useAuthStore]
  );

  return {
    makeRequest,
  };
}
