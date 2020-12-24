import { ref } from "vue";
import { useI18n } from "vue-i18n";

export default function useTranslationsUtils() {
  const locale = ref(null);
  const { t } = useI18n();

  function initTranslationsUtils() {
    if (window.Intl && typeof window.Intl === "object") {
      locale.value = navigator.language.substring(0, 2);
    }
  }

  function getTranslation(key) {
    return t(key, {}, { locale: locale.value });
  }

  return { getTranslation, t, initTranslationsUtils, locale };
}
