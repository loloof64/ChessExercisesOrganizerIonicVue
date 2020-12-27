<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("save_game_explorer.title") }}</ion-title>
        <div class="path">{{ currentPathString }}</div>
        <div class="toolbar">
          <div class="bar_item" @click="addFolderRequest">
            <ion-icon :icon="folder" />
          </div>
          <div
            class="bar_item"
            @click="renameRequest"
            v-if="renameButtonVisible"
          >
            <ion-icon :icon="create" />
          </div>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <simple-dialog ref="simpleDialog" />
      <file-explorer
        path="pgn/my_games"
        @error="handleError"
        ref="explorer"
        @new-path="handleNewPath"
        @selected-changed="handleSelectedChanged"
      />
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
import { ref, computed } from "vue";
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
import { folder, create } from "ionicons/icons";
import FileExplorer from "@/components/file-explorer/LocalFileExplorer";
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
    const currentPathString = ref("");
    const explorer = ref(null);
    const selectedItemsCount = ref(0);
    const lastSelectedItem = ref(null);

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

    function handleNewPath(path) {
      currentPathString.value = path;
    }

    function updateSelectedItemsCount() {
      const allItems = document.querySelectorAll(".item");
      let count = 0;
      allItems?.forEach((item) => {
        if (item.classList.contains("selected")) count += 1;
      });

      selectedItemsCount.value = count;
    }

    function renameRequest() {
      if (!lastSelectedItem.value) return;
      if (lastSelectedItem.value.type === "goBack") return;

      const oldName = lastSelectedItem.value.name;

      simpleDialog.value.showPrompt({
        title: getTranslation("save_game_explorer.rename_prompt_title"),
        fieldName: getTranslation("save_game_explorer.rename_prompt_field"),
        initialValue: oldName,
        onConfirm: doRename,
      });
    }

    async function doRename(name) {
      const oldName = lastSelectedItem.value.name;
      const isForbidenFolderName =
        lastSelectedItem.value.type === "folder" && name.includes(".");
      if (isForbidenFolderName) {
        simpleDialog.value.showMessage({
          title: getTranslation("save_game_explorer.forbidden_name_title"),
          message: getTranslation("save_game_explorer.forbidden_name_message"),
        });
        return;
      }
      if (name === oldName) return;

      let newName = name;
      if (lastSelectedItem.value.type === "file" && !newName.endsWith('.pgn')) newName += '.pgn';

      const from = `${explorer.value?.getCurrentFolder()}/${oldName}`;
      const to = `${explorer.value?.getCurrentFolder()}/${newName}`;

      try {
        await Filesystem.rename({
          from,
          to,
          directory: FilesystemDirectory.Documents,
        });
        explorer.value?.refreshContent();
      } catch (err) {
        console.error(err);
        simpleDialog.value.showMessage({
          title: getTranslation("save_game_explorer.failed_renaming_title"),
          message: err,
        });
      }
    }

    function handleSelectedChanged({ item, newSelectedState }) {
      if (newSelectedState === true) {
        lastSelectedItem.value = item;
      }
      setTimeout(updateSelectedItemsCount, 50);
    }

    const renameButtonVisible = computed(() => {
      return selectedItemsCount.value === 1;
    });

    return {
      simpleDialog,
      handleError,
      handleNewPath,
      getTranslation,
      cancel,
      save,
      filename,
      explorer,
      folder,
      create,
      addFolderRequest,
      currentPathString,
      renameRequest,
      updateSelectedItemsCount,
      handleSelectedChanged,
      renameButtonVisible,
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
  justify-content: center;
  align-items: center;
}

.toolbar .bar_item {
  border: 1px solid gray;
  padding: 3px;
  margin: 6px;
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

.path {
  width: 100%;
  height: 6vh;
  font-size: 1.1em;
  font-family: serif;
  background-color: khaki;
  overflow: scroll;
  overflow-wrap: normal;
  white-space: nowrap;
  vertical-align: middle;
}
</style>