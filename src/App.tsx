import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BrowserRouter, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import { useLogStore } from "./store/log";

import HomeScreen from "./screens/Home";
import OpdsScreen from "./screens/Opds";
import LibrariesScreen from "./screens/Libraries";
import LibrariesOpds from "./screens/LibrariesOpds";
import LibraryScreen from "./screens/Library";
import LibraryOpds from "./screens/LibraryOpds";
import BookScreen from "./screens/Book";
import BookMetadataScreen from "./screens/BookMetadata";
import BookReadScreen from "./screens/BookRead";
import MangaScreen from "./screens/Manga";
import MangaMetadata from "./screens/MangaMetadata";
import MangaReadScreen from "./screens/MangaRead";
import MangaReadBounce from "./screens/MangaReadBounce";
import Collection from "./screens/Collection";
import SettingsClient from "./screens/SettingsClient";
import ProviderGoogle from "./screens/ProviderGoogle";
import OauthGoogle from "./screens/OauthGoogle";
import Users from "./screens/Users";
import ImportHandler from "./components/molecules/import/ImportHandler";

import "../i18n";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { DeepLinkHandler } from "./components/handlers/DeepLinkHandler";

function App() {
  const basePath = import.meta.env.VITE_PUBLIC_BASE_PATH ?? "/";
  const addLog = useLogStore((state) => state.addLog);

  useEffect(() => {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    const createInterceptor = (
      method: keyof typeof originalConsole,
      level: string
    ) => {
      return (...args: any[]) => {
        originalConsole[method](...args);

        try {
          const logData = {
            level,
            timestamp: new Date().toISOString(),
            message: args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg)
              )
              .join(" "),
            args,
          };

          if (level === "error") {
            addLog(logData);
          }
        } catch (error) {
          originalConsole.error("Console interceptor error:", error);
        }
      };
    };

    console.log = createInterceptor("log", "log");
    console.error = createInterceptor("error", "error");
    console.warn = createInterceptor("warn", "warn");
    console.info = createInterceptor("info", "info");
    console.debug = createInterceptor("debug", "debug");

    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    };
  }, []);

  useEffect(() => {
    const appWindow = getCurrentWindow();

    document
      .getElementById("titlebar-minimize")
      ?.addEventListener("click", () => appWindow.minimize());
    document
      .getElementById("titlebar-maximize")
      ?.addEventListener("click", () => appWindow.toggleMaximize());
    document
      .getElementById("titlebar-close")
      ?.addEventListener("click", () => appWindow.close());

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/opds" element={<OpdsScreen />} />
        <Route path="/libraries" element={<LibrariesScreen />} />
        <Route path="/libraries-opds" element={<LibrariesOpds />} />
        <Route path="/library/:id" element={<LibraryScreen />} />
        <Route path="/library-opds" element={<LibraryOpds />} />
        <Route path="/book/:id" element={<BookScreen />} />
        <Route path="/book/:id/metadata" element={<BookMetadataScreen />} />
        <Route path="/book/:id/read" element={<BookReadScreen />} />
        <Route path="/manga/:id" element={<MangaScreen />} />
        <Route path="/manga/:id/metadata" element={<MangaMetadata />} />
        <Route path="/manga/:id/read" element={<MangaReadScreen />} />
        <Route path="/manga/read-bounce" element={<MangaReadBounce />} />
        <Route path="/collection/:id" element={<Collection />} />
        <Route path="/settings/client" element={<SettingsClient />} />
        <Route path="/providers/google" element={<ProviderGoogle />} />
        <Route path="/oauth-google" element={<OauthGoogle />} />
        <Route path="/users" element={<Users />} />
      </Routes>
      <DeepLinkHandler />
      <ImportHandler />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
