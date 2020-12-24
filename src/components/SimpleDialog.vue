<template>
  <div class="simple-dialog"></div>
</template>

<script>
import useTranslationUtils from "@/hooks/TranslationUtils";
import { alertController } from "@ionic/vue";

export default {
  setup() {
    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

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
    };
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