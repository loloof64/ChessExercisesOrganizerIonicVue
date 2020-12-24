<template>
  <div class="simple-dialog"></div>
</template>

<script>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { alertController } from "@ionic/vue";

export default {
  setup() {
    const locale = ref(null);

    const { t } = useI18n();

    if (window.Intl && typeof window.Intl === "object") {
      locale.value = navigator.language.substring(0, 2);
    }

    function getTranslation(key) {
      return t(key, {}, { locale: locale.value });
    }

    async function showConfirm({ title, message, onCancel, onConfirm }) {
      const alert = await alertController.create({
        cssClass: "confirmDialog",
        header: title,
        message: message,
        buttons: [
          {
            text: getTranslation("general.cancel_button"),
            role: "cancel",
            cssClass: "secondaryButton",
            handler: () => {
              if (onCancel) onCancel();
            },
          },
          {
            text: getTranslation("general.ok_button"),
            role: "primary",
            cssClass: "primaryButton",
            handler: () => {
              if (onConfirm) onConfirm();
            },
          },
        ],
      });
      alert.present();
    }

    async function showMessage({ title, message }) {
      const alert = await alertController.create({
        cssClass: "confirmDialog",
        header: title,
        message: message,
        buttons: [
          {
            text: getTranslation("general.ok_button"),
            role: "primary",
            cssClass: "primaryButton",
            handler: () => {},
          },
        ],
      });
      alert.present();
    }


    return {
        showConfirm,
        showMessage,
    }
  },
};
</script>

<style>
.simple-dialog {
  display: none;
}
.alert-wrapper {
  background-color: rgba(45, 211, 211, 0.6) !important;
}

.alert-wrapper .alert-message {
  color: blue;
}

.primaryButton.alert-button {
  background-color: green;
  color: white;
  border-radius: 20%;
}

.secondaryButton.alert-button {
  background-color: red;
  color: white;
  border-radius: 20%;
}
</style>