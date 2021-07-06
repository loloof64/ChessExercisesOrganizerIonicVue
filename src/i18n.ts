import { createI18n } from "vue-i18n";
const fr = require("./locales/fr.json");
const en = require("./locales/en.json");
const es = require("./locales/es.json");

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