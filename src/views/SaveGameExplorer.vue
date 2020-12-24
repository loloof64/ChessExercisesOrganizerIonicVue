<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{
          getTranslation("save_game_explorer.title")
        }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <simple-dialog ref="simpleDialog" />
      <file-explorer :path="path" :directory="directory" @error="handleError" />
    </ion-content>
  </ion-page>
</template>

<script>
import { ref, onMounted } from "vue";
import FileExplorer from "@/components/FileExplorer";
import SimpleDialog from "@/components/SimpleDialog";
import { FilesystemDirectory, Plugins } from "@capacitor/core";
const { Filesystem } = Plugins;
import useTranslationUtils from "@/hooks/TranslationUtils";

export default {
  setup() {
    const simpleDialog = ref(null);

    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const directory = ref(null);
    const path = "pgn/my_games";

    onMounted(async () => {
      try {
        await Filesystem.mkdir({
          path: "pgn/my_games",
          directory: FilesystemDirectory.Documents,
          recursive: true,
        });
      } catch (err) {
        console.error(err);
      }
    });

    function handleError(error) {
      console.error(error);
      simpleDialog.value.showMessage({
        title: getTranslation("save_game_explorer.error_in_explorer"),
        message: error,
      });
    }

    return {
      directory,
      path,
      simpleDialog,
      handleError,
      getTranslation,
    };
  },
  components: {
    FileExplorer,
    SimpleDialog,
  },
};
</script>

<style scoped>
</style>