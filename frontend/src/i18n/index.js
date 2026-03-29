import { createI18n } from "vue-i18n";
import es from "./locales/es.json";
import en from "./locales/en.json";

const savedLocale = localStorage.getItem("locale") || "es";

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: "en",
  messages: { es, en },
});

export default i18n;

export function setLocale(locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem("locale", locale);
  document.documentElement.setAttribute("lang", locale);
}
