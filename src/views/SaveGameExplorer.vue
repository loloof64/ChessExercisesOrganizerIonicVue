<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("save_game_explorer.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <simple-dialog ref="simpleDialog" />
      <file-explorer path="pgn/my_games" @error="handleError" />
    </ion-content>
    <ion-footer>
      <div class="buttons_zone">
        <div class="button cancel" @click="cancel">
          {{ getTranslation("general.cancel_button") }}
        </div>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonPage,
  IonFooter,
} from "@ionic/vue";
import FileExplorer from "@/components/LocalFileExplorer";
import SimpleDialog from "@/components/SimpleDialog";
import useTranslationUtils from "@/hooks/TranslationUtils";
import { useRouter } from "vue-router";

export default {
  setup() {
    const simpleDialog = ref(null);
    const router = useRouter();

    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    function handleError(error) {
      console.error(error);
      simpleDialog.value.showMessage({
        title: getTranslation("save_game_explorer.error_in_explorer"),
        message: error,
      });
    }

    function cancel() {
      router.go(-1);
    }

    return {
      simpleDialog,
      handleError,
      getTranslation,
      cancel,
    };
  },
  components: {
    IonHeader,
    IonFooter,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    FileExplorer,
    SimpleDialog,
  },
};
</script>

<style scoped>
.buttons_zone {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

.button.cancel {
  color: white;
  background-color: red;
  border-radius: 12%;
}
</style>