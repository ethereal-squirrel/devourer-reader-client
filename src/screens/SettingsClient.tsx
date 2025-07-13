import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import Colorful from "@uiw/react-color-colorful";
import { hsvaToHex, hexToHsva } from "@uiw/color-convert";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useOpdsStore } from "../store/opds";
import { useUIStore } from "../store/ui";

const fontSizes = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170,
  180, 190, 200,
];

const opdsLimits = [10, 25, 50, 100, 250, 500, 1000];

export default function SettingsClient() {
  const { t } = useTranslation();
  const { opdsUrl, setOpdsUrl, opdsLimit, setOpdsLimit } = useOpdsStore(
    useShallow((state) => ({
      opdsUrl: state.opdsUrl,
      setOpdsUrl: state.setOpdsUrl,
      opdsLimit: state.opdsLimit,
      setOpdsLimit: state.setOpdsLimit,
    }))
  );
  const {
    bookTheme,
    setBookTheme,
    bookCustomBackground,
    setBookCustomBackground,
    bookCustomForeground,
    setBookCustomForeground,
    bookCustomFontSize,
    setBookCustomFontSize,
    mangaDirection,
    setMangaDirection,
    mangaViewMode,
    setMangaViewMode,
    mangaFitMode,
    setMangaFitMode,
  } = useUIStore(
    useShallow((state) => ({
      bookTheme: state.bookTheme,
      setBookTheme: state.setBookTheme,
      bookCustomBackground: state.bookCustomBackground,
      setBookCustomBackground: state.setBookCustomBackground,
      bookCustomForeground: state.bookCustomForeground,
      setBookCustomForeground: state.setBookCustomForeground,
      bookCustomFontSize: state.bookCustomFontSize,
      setBookCustomFontSize: state.setBookCustomFontSize,
      mangaDirection: state.mangaDirection,
      setMangaDirection: state.setMangaDirection,
      mangaViewMode: state.mangaViewMode,
      setMangaViewMode: state.setMangaViewMode,
      mangaFitMode: state.mangaFitMode,
      setMangaFitMode: state.setMangaFitMode,
    }))
  );

  const [bookBackgroundHsva, setBookBackgroundHsva] = useState(
    hexToHsva(bookCustomBackground)
  );
  const [bookForegroundHsva, setBookForegroundHsva] = useState(
    hexToHsva(bookCustomForeground)
  );

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-[8rem] pt-8">
        <div className="flex flex-col items-center justify-center h-full w-full md:w-1/2 md:mx-auto">
          <div className="mx-auto w-full max-w-lg divide-y divide-white/5 rounded-xl bg-primary">
            <Disclosure as="div" className="p-6" defaultOpen={false}>
              {({ open }) => (
                <>
                  <DisclosureButton className="group flex w-full items-center justify-between">
                    <h2 className="text-lg font-medium text-white group-data-hover:text-white/80">
                      {t("settings.bookSettings.title")}
                    </h2>
                    <ChevronDownIcon
                      className={`size-5 fill-white/60 group-data-hover:fill-white/50 ${
                        open && "rotate-180"
                      }`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 text-sm/5 text-white">
                    <div>
                      <label
                        htmlFor="book-default-theme"
                        className="text-sm/6 font-semibold text-white"
                      >
                        {t("settings.bookSettings.defaultTheme")}
                      </label>
                      <div>
                        <select
                          id="book-default-theme"
                          className="my-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500 capitalize"
                          value={String(bookTheme)}
                          onChange={(e) =>
                            setBookTheme(
                              e.target.value as "light" | "dark" | "custom"
                            )
                          }
                        >
                          {["light", "dark", "custom"].map((theme) => (
                            <option
                              key={theme}
                              value={theme}
                              className="bg-gray-900 text-white capitalize"
                            >
                              {theme}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="text-sm/6 font-semibold text-white">
                        {t("settings.bookSettings.customBackground")}
                      </label>
                      <div className="mt-2 mb-3 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Colorful
                            color={bookBackgroundHsva}
                            onChange={(color) => {
                              setBookBackgroundHsva(color.hsva);
                              setBookCustomBackground(hsvaToHex(color.hsva));
                            }}
                          />
                        </div>
                        <div
                          className="rounded-xl w-full h-full"
                          style={{
                            backgroundColor: hsvaToHex(bookBackgroundHsva),
                          }}
                        ></div>
                      </div>
                      <label className="text-sm/6 font-semibold text-white">
                        {t("settings.bookSettings.customForeground")}
                      </label>
                      <div className="mt-2 mb-3 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Colorful
                            color={bookForegroundHsva}
                            onChange={(color) => {
                              setBookForegroundHsva(color.hsva);
                              setBookCustomForeground(hsvaToHex(color.hsva));
                            }}
                          />
                        </div>
                        <div
                          className="rounded-xl w-full h-full"
                          style={{
                            backgroundColor: hsvaToHex(bookForegroundHsva),
                          }}
                        ></div>
                      </div>
                      <label
                        htmlFor="book-font-size"
                        className="text-sm/6 font-semibold text-white"
                      >
                        {t("settings.bookSettings.fontSize")}
                      </label>
                      <div>
                        <select
                          id="book-font-size"
                          className="mt-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500"
                          value={String(bookCustomFontSize)}
                          onChange={(e) =>
                            setBookCustomFontSize(Number(e.target.value))
                          }
                        >
                          {fontSizes.map((size) => (
                            <option
                              key={size}
                              value={size}
                              className="bg-gray-900 text-white"
                            >
                              {size}%
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
            <Disclosure as="div" className="p-6" defaultOpen={false}>
              {({ open }) => (
                <>
                  <DisclosureButton className="group flex w-full items-center justify-between">
                    <h2 className="text-lg font-medium text-white group-data-hover:text-white/80">
                      {t("settings.mangaSettings.title")}
                    </h2>
                    <ChevronDownIcon
                      className={`size-5 fill-white/60 group-data-hover:fill-white/50 ${
                        open && "rotate-180"
                      }`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 text-sm/5 text-white">
                    <div>
                      <label
                        htmlFor="manga-direction"
                        className="text-sm/6 font-semibold text-white"
                      >
                        {t("settings.mangaSettings.readingDirection")}
                      </label>
                      <select
                        id="manga-direction"
                        className="mt-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500"
                        value={mangaDirection}
                        onChange={(e) =>
                          setMangaDirection(e.target.value as "ltr" | "rtl")
                        }
                      >
                        <option value="ltr">Left to right</option>
                        <option value="rtl">Right to left</option>
                      </select>
                    </div>
                    <div className="mt-2">
                      <label
                        htmlFor="manga-fit-mode"
                        className="text-sm/6 font-semibold text-white"
                      >
                        {t("settings.mangaSettings.pageFitMode")}
                      </label>
                      <select
                        id="manga-fit-mode"
                        className="mt-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500"
                        value={mangaFitMode}
                        onChange={(e) =>
                          setMangaFitMode(
                            e.target.value as "contain" | "actual"
                          )
                        }
                      >
                        <option value="contain">
                          {t("settings.mangaSettings.contain")}
                        </option>
                        <option value="actual">
                          {t("settings.mangaSettings.actual")}
                        </option>
                      </select>
                    </div>
                    <div className="mt-2">
                      <label
                        htmlFor="manga-direction"
                        className="text-sm/6 font-semibold text-white"
                      >
                        {t("settings.mangaSettings.viewMode")}
                      </label>
                      <select
                        id="manga-view-mode"
                        className="mt-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500"
                        value={mangaViewMode}
                        onChange={(e) =>
                          setMangaViewMode(
                            e.target.value as "single" | "double"
                          )
                        }
                      >
                        <option value="single">
                          {t("settings.mangaSettings.single")}
                        </option>
                        <option value="double">
                          {t("settings.mangaSettings.double")}
                        </option>
                      </select>
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
            <Disclosure as="div" className="p-6" defaultOpen={false}>
              {({ open }) => (
                <>
                  <DisclosureButton className="group flex w-full items-center justify-between">
                    <h2 className="text-lg font-medium text-white group-data-hover:text-white/80">
                      {t("settings.opdsSettings.title")}
                    </h2>
                    <ChevronDownIcon
                      className={`size-5 fill-white/60 group-data-hover:fill-white/50 ${
                        open && "rotate-180"
                      }`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 text-sm/5 text-white">
                    <div>
                      <div>
                        <label
                          htmlFor="opds-url"
                          className="text-sm/6 font-semibold text-white"
                        >
                          {t("settings.opdsSettings.savedOpdsUrl")}
                        </label>
                        <input
                          id="opds-url"
                          className="mt-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500"
                          value={opdsUrl || ""}
                          onChange={(e) => setOpdsUrl(e.target.value)}
                        />
                      </div>
                      <div className="mt-2">
                        <label
                          htmlFor="opds-url"
                          className="text-sm/6 font-semibold text-white"
                        >
                          {t("settings.opdsSettings.booksPerPage")}
                        </label>
                        <select
                          id="opds-url"
                          className="mt-2 w-full bg-gray-900 text-white rounded-md p-2 border border-gray-500"
                          value={String(opdsLimit)}
                          onChange={(e) => setOpdsLimit(Number(e.target.value))}
                        >
                          {opdsLimits.map((limit) => (
                            <option
                              key={limit}
                              value={limit}
                              className="bg-gray-900 text-white"
                            >
                              {limit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          </div>
        </div>
      </Container>
      <TabBar />
    </div>
  );
}
