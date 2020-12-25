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
} from "@ionic/vue";
import FileExplorer from "@/components/LocalFileExplorer";
import SimpleDialog from "@/components/SimpleDialog";
import useTranslationUtils from "@/hooks/TranslationUtils";

export default {
  setup() {
    const simpleDialog = ref(null);

    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    function handleError(error) {
      console.error(error);
      simpleDialog.value.showMessage({
        title: getTranslation("save_game_explorer.error_in_explorer"),
        message: error,
      });
    }

    return {
      simpleDialog,
      handleError,
      getTranslation,
    };
  },
  components: {
    IonHeader,
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
</style>