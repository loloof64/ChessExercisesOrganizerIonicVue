import { createI18n } from "vue-i18n";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

const messages = {
  fr,
  en,
  es,
};

const i18n = createI18n({
  legacy: false,
  fallbackLocale: "en",
  messages,
});

export  default i18n;