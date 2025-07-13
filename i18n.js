import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEn from "./locales/en-GB/translation.json";

const resources = {
  "en-GB": { translation: translationEn },
};

i18n.use(initReactI18next).init({
  lng: "en-GB",
  fallbackLng: "en-GB",
  debug: true,

  interpolation: {
    escapeValue: false,
  },
  resources,
});

export default i18n;
