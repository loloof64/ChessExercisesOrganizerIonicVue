<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("save_game_explorer.title") }}</ion-title>
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
} from "@ionic/vue";
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
.filename {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
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