<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("save_game_explorer.title") }}</ion-title>
        <div class="toolbar">
          <div class="bar_item" @click="addFolderRequest">
            <ion-icon :icon="folderOutline" />
          </div>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <simple-dialog ref="simpleDialog" />
      <file-explorer path="pgn/my_games" @error="handleError" ref="explorer" />
    </ion-content>
    <ion-footer>
      <div class="filename">
        Nom: <input type="text" v-model="filename" />.pgn
      </div>
      <div class="buttons_zone">
        <div class="button cancel" @click="cancel">
          {{ getTranslation("general.cancel_button") }}
        </div>
        <div class="button ok" @click="save">
          {{ getTranslation("general.save_button") }}
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
  toastController,
  IonIcon,
} from "@ionic/vue";
import { folderOutline } from "ionicons/icons";
import FileExplorer from "@/components/LocalFileExplorer";
import SimpleDialog from "@/components/SimpleDialog";
import useTranslationUtils from "@/hooks/TranslationUtils";
import { useRouter, useRoute } from "vue-router";
import {
  Plugins,
  FilesystemDirectory,
  FilesystemEncoding,
} from "@capacitor/core";

const { Filesystem } = Plugins;

export default {
  setup() {
    const simpleDialog = ref(null);
    const router = useRouter();
    const route = useRoute();

    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const filename = ref("");
    const explorer = ref(null);

    function handleError(error) {
      console.error(error);
      simpleDialog.value.showMessage({
        title: getTranslation("save_game_explorer.error_in_explorer"),
        message: error,
      });
    }

    function cancel() {
      router.back();
    }

    function addFolderRequest() {
      simpleDialog.value.showPrompt({
        title: getTranslation("save_game_explorer.new_folder_prompt_title"),
        fieldName: getTranslation("save_game_explorer.new_folder_prompt_field"),
        onConfirm: addFolder,
      });
    }

    async function addFolder(folderName) {
      const currentFolderPath = explorer.value?.getCurrentFolder();
      if (!currentFolderPath) throw "File explorer is not ready.";

      const path = `${currentFolderPath}/${folderName}`;
      try {
        await Filesystem.mkdir({
          path,
          directory: FilesystemDirectory.Documents,
          recursive: true,
        });

        explorer.value?.refreshContent();
      } catch (err) {
        console.error(err);
        simpleDialog.value.showMessage({
          title: getTranslation("save_game_explorer.failed_creating_folder"),
          message: err,
        });
      }
    }

    async function showToast(message, duration = 1100) {
      const toast = await toastController.create({
        message,
        duration: duration,
      });
      return toast.present();
    }

    async function save() {
      try {
        const name = filename.value;
        if (name.length === 0) return;

        const gamePgn = JSON.parse(route.params.gamePgn);
        const currentFolderPath = explorer.value?.getCurrentFolder();

        if (!currentFolderPath) throw "File explorer is not ready.";

        const filePath = `${currentFolderPath}/${filename.value.trim()}.pgn`;
        await Filesystem.writeFile({
          path: filePath,
          data: gamePgn,
          directory: FilesystemDirectory.Documents,
          encoding: FilesystemEncoding.ASCII,
          recursive: true,
        });

        showToast(getTranslation("save_game_explorer.success_saving_game"));

        router.back();
      } catch (err) {
        console.error(err);
        simpleDialog.value.showMessage({
          title: getTranslation("save_game_explorer.failed_saving_game_title"),
          message: getTranslation(
            "save_game_explorer.failed_saving_game_message"
          ),
        });
      }
    }

    return {
      simpleDialog,
      handleError,
      getTranslation,
      cancel,
      save,
      filename,
      explorer,
      folderOutline,
      addFolderRequest,
    };
  },
  components: {
    IonHeader,
    IonFooter,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonIcon,
    FileExplorer,
    SimpleDialog,
  },
};
</script>

<style scoped>
.filename {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.toolbar {
  background-color: aliceblue;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

.toolbar .bar_item {
  border: 1px solid gray;
  padding: 3px;
}

.buttons_zone {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.button {
  color: white;
  border-radius: 12%;
  margin: 5px;
}

.button.cancel {
  background-color: red;
}

.button.ok {
  background-color: green;
}
</style>