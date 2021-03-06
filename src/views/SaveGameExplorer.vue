<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("save_game_explorer.title") }}</ion-title>
        <div class="path">{{ currentPathString }}</div>
        <div class="toolbar">
          <ion-spinner
            color="tertiary"
            v-if="longOperationPending"
          ></ion-spinner>
          <div
            class="bar_item"
            @click="addFolderRequest"
            v-if="newFolderButtonVisible"
          >
            <ion-icon :icon="folder" />
          </div>
          <div
            class="bar_item"
            @click="renameRequest"
            v-if="renameButtonVisible"
          >
            <ion-icon :icon="create" />
          </div>
          <div class="bar_item" @click="copySelection" v-if="copyButtonVisible">
            <ion-icon :icon="copy" />
          </div>
          <div
            class="bar_item"
            @click="pasteSelection"
            v-if="pasteButtonVisible"
          >
            <ion-icon :icon="clipboard" />
          </div>
          <div
            class="bar_item"
            @click="cancelSelection"
            v-if="pasteButtonVisible"
          >
            <ion-icon :icon="stopCircle" />
          </div>
          <div
            class="bar_item"
            @click="deleteSelection"
            v-if="copyButtonVisible"
          >
            <ion-icon :icon="trash" />
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
        :blockingItemsSelection="blockingItemsSelection"
        @new-path="handleNewPath"
        @selected-changed="handleSelectedChanged"
      />
    </ion-content>
    <ion-footer>
      <div class="filename">
        Nom: <input type="text" v-model="filename" />.pgn
      </div>
      <div class="buttons_zone">
        <div class="button cancel" @click="cancelExplorer">
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
import { ref, computed, watch } from "vue";
import {
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonPage,
  IonFooter,
  toastController,
  IonIcon,
} from "@ionic/vue";
import {
  folder,
  create,
  copy,
  clipboard,
  cut,
  stopCircle,
  trash,
} from "ionicons/icons";
import FileExplorer from "@/components/file-explorer/LocalFileExplorer";
import SimpleDialog from "@/components/SimpleDialog";
import useTranslationUtils from "@/hooks/TranslationUtils";
import { useRouter } from "vue-router";
import {
  Filesystem,
  Directory,
  Encoding,
} from "@capacitor/filesystem";

import { useStore } from "vuex";
import moment from "moment";

export default {
  setup() {
    const simpleDialog = ref(null);
    const router = useRouter();

    const store = useStore();

    const { t, getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const filename = ref("");
    const currentPathString = ref("");
    const copyPathString = ref(null);
    const explorer = ref(null);
    const lastSelectedItem = ref(null);
    const selectedItemsCount = ref(0);
    const itemsToCopy = ref([]);
    const blockingItemsSelection = ref(false);
    const remainingLongOperationElementsToDelete = ref(0);
    const remainingLongOperationElementsToCopy = ref(0);
    const needToClearDeleteSelectionAsync = ref(false);
    const needToClearCopySelectionAsync = ref(false);
    const longOperationPending = ref(false);

    function handleError(error) {
      simpleDialog.value.showMessage({
        title: getTranslation("save_game_explorer.error_in_explorer"),
        message: error,
      });
    }

    function cancelExplorer() {
      const longOperationRunning = longOperationPending.value;

      if (longOperationRunning) {
        simpleDialog.value.showConfirm({
          title: getTranslation("save_game_explorer.confirm_exit_title"),
          message: getTranslation("save_game_explorer.confirm_exit_message"),
          onConfirm: doCancelExplorer,
        })
      }
      else doCancelExplorer()
    }

    function doCancelExplorer() {
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
      const folderAlreadyExists = explorer.value?.elementAlreadyExistsInCurrentFolder(
        folderName
      );
      if (folderAlreadyExists) {
        simpleDialog.value.showMessage({
          title: getTranslation(
            "save_game_explorer.folder_already_exists_title"
          ),
          message: getTranslation(
            "save_game_explorer.folder_already_exists_message"
          ),
        });
        return;
      }

      const currentFolderPath = explorer.value?.getCurrentFolder();
      if (!currentFolderPath) throw "File explorer is not ready.";

      const path = `${currentFolderPath}/${folderName}`;
      try {
        await Filesystem.mkdir({
          path,
          directory: Directory.Documents,
          recursive: true,
        });

        refreshContent();
      } catch (err) {
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

        const namePgn = `${filename.value.trim()}.pgn`;
        const alreadyExists = explorer.value?.elementAlreadyExistsInCurrentFolder(
          namePgn
        );

        if (alreadyExists) {
          simpleDialog.value.showMessage({
            title: getTranslation(
              "save_game_explorer.file_already_exists_title"
            ),
            message: getTranslation(
              "save_game_explorer.file_already_exists_message"
            ),
          });
          return;
        }

        const gamePgn = store.getters.activeGamePgn;
        const currentFolderPath = explorer.value?.getCurrentFolder();

        if (!currentFolderPath) throw "File explorer is not ready.";

        const filePath = `${currentFolderPath}/${namePgn}`;
        await Filesystem.writeFile({
          path: filePath,
          data: gamePgn,
          directory: Directory.Documents,
          encoding: Encoding.ASCII,
          recursive: true,
        });

        showToast(getTranslation("save_game_explorer.success_saving_game"));

        router.back();
      } catch (err) {
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
      updateSelectedItemsCount();
    }

    function updateSelectedItemsCount() {
      const selectedItems = explorer.value?.getSelectedItems();
      selectedItemsCount.value = 0;
      const currentFolder = explorer.value?.getCurrentFolder();

      selectedItems.forEach((item) => {
        const lastSlashIndexInItemPath = item.path.lastIndexOf("/");
        const itemFolder = item.path.slice(0, lastSlashIndexInItemPath);
        if (itemFolder === currentFolder) selectedItemsCount.value += 1;
      });
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
      if (lastSelectedItem.value.type === "file" && !newName.endsWith(".pgn"))
        newName += ".pgn";

      const from = `${explorer.value?.getCurrentFolder()}/${oldName}`;
      const to = `${explorer.value?.getCurrentFolder()}/${newName}`;

      try {
        await Filesystem.rename({
          from,
          to,
          directory: Directory.Documents,
        });
        explorer.value?.clearSelectedItems();
        updateSelectedItemsCount();
        refreshContent();
      } catch (err) {
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

    function copySelection() {
      copyPathString.value = explorer.value?.getCurrentFolder();
      itemsToCopy.value = explorer.value?.getSelectedItems() || [];
      explorer.value?.clearSelectedItems();
      blockingItemsSelection.value = true;
      showToast(getTranslation("save_game_explorer.items_copied_in_clipboard"));
    }

    function pasteSelection() {
      const isCopyAction = itemsToCopy.value.length > 0;
      if (!isCopyAction) return;

      const selectedItems = itemsToCopy.value;
      const destinationFolder = explorer.value?.getCurrentFolder();
      const sourcePath = selectedItems[0].path;
      const lastSlashIndexInSourcePath = sourcePath.lastIndexOf("/");
      const sourceFolder = sourcePath.slice(0, lastSlashIndexInSourcePath);

      if (isCopyAction && destinationFolder === sourceFolder) {
        simpleDialog.value.showConfirm({
          title: getTranslation(
            "save_game_explorer.copy_in_same_folder_confirmation_title"
          ),
          message: getTranslation(
            "save_game_explorer.copy_in_same_folder_confirmation_message"
          ),
          onConfirm: () =>
            doPasteSelection({
              selectedItems,
            }),
        });
        return;
      } else doPasteSelection({ selectedItems });
    }

    async function doPasteSelection({ selectedItems }) {
      explorer.value?.notifyLongOperationPending();
      longOperationPending.value = true;

      needToClearCopySelectionAsync.value = true;
      remainingLongOperationElementsToCopy.value = selectedItems.length;

      setTimeout(() => {
        const destinationFolder = explorer.value?.getCurrentFolder();
        const commonDatePrefix = moment().format("YYYYMMDDHHmmss");

        let copyFailedList = [];
        let overridingSomeElements = false;

        // copying
        selectedItems.forEach(async (item) => {
          try {
            const nameAlreadyTaken = explorer.value?.elementAlreadyExistsInCurrentFolder(
              item.name
            );
            if (nameAlreadyTaken) overridingSomeElements = true;
            const from = item.path;
            const to = `${destinationFolder}/${
              nameAlreadyTaken ? commonDatePrefix + "_" : ""
            }${item.name}`;

            const tryingToMoveParentFolderIntoChild =
              item.type === "folder" && to.startsWith(from);
            if (tryingToMoveParentFolderIntoChild) {
              showToast(
                getTranslation(
                  "save_game_explorer.moving_folder_from_parent_to_child_error"
                ),
                2000
              );
              copyFailedList.push(item);
            } else {
              await Filesystem.copy({
                from,
                to,
                directory: Directory.Documents,
              });

              refreshContent();
            }
          } catch (err) {
            copyFailedList.push(item);
          }

          remainingLongOperationElementsToCopy.value -= 1;
        });

        if (overridingSomeElements) {
          showToast(
            getTranslation(
              "save_game_explorer.renaming_some_elements_while_pasting"
            ),
            4000
          );
        }

      }, 1500);
    }

    function clearSelection() {
      itemsToCopy.value = [];
      copyPathString.value = null;
      explorer.value?.clearSelectedItems();
      updateSelectedItemsCount();
    }

    function refreshContent() {
      explorer.value?.refreshContent();
    }

    function cancelLongOperationBlockingStatus() {
      explorer.value?.clearLongOperationPendingStatus();
      longOperationPending.value = false;
    }

    function cancelItemsInteractionBlocking() {
      blockingItemsSelection.value = false;
    }

    function cancelSelection() {
      clearSelection();
      cancelItemsInteractionBlocking();
      refreshContent();
      showToast(getTranslation("save_game_explorer.copy_cut_cancelled"), 2000);
    }

    function deleteSelection() {
      const selectedItems = explorer.value?.getSelectedItems();

      const originFolder = currentPathString.value;
      const elementsListString = selectedItems
        .map((item) => `* ${item.name}`)
        .join("<br />");

      const message = `${t(
        "save_game_explorer.delete_selection_confirmation_message",
        { originFolder }
      )}<br />${elementsListString}`;

      simpleDialog.value.showConfirm({
        title: getTranslation(
          "save_game_explorer.delete_selection_confirmation_title"
        ),
        message,
        onConfirm: () => doDeleteSelection({ selectedItems }),
      });
    }

    function doDeleteSelection({ selectedItems }) {
      explorer.value?.notifyLongOperationPending();
      longOperationPending.value = true;

      needToClearDeleteSelectionAsync.value = true;
      remainingLongOperationElementsToDelete.value = selectedItems.length;

      setTimeout(() => {
        selectedItems.forEach(async (item) => {
          try {
            const elementToRemove = `${item.path}`;
            const isFile = item.type === "file";

            if (isFile) {
              await Filesystem.deleteFile({
                path: elementToRemove,
                directory: Directory.Documents,
              });
            } else {
              await Filesystem.rmdir({
                path: elementToRemove,
                directory: Directory.Documents,
                recursive: true,
              });
            }

            refreshContent();
          }
          finally {
            remainingLongOperationElementsToDelete.value -= 1;
          }

        });
      }, 1500);
    }

    const newFolderButtonVisible = computed(() => {
      if (remainingLongOperationElementsToDelete.value) return false;
      if (remainingLongOperationElementsToCopy.value) return false;
      return true;
    });

    const renameButtonVisible = computed(() => {
      if (remainingLongOperationElementsToDelete.value) return false;
      if (remainingLongOperationElementsToCopy.value) return false;
      return selectedItemsCount.value === 1;
    });

    const copyButtonVisible = computed(() => {
      if (remainingLongOperationElementsToDelete.value) return false;
      if (remainingLongOperationElementsToCopy.value) return false;
      const itemsToCopyLength = itemsToCopy.value?.length || 0;
      return selectedItemsCount.value > 0 && itemsToCopyLength === 0;
    });

    const pasteButtonVisible = computed(() => {
      if (remainingLongOperationElementsToDelete.value) return false;
      if (remainingLongOperationElementsToCopy.value) return false;
      if (!itemsToCopy.value) return false;
      return itemsToCopy.value.length > 0;
    });

    watch(
      [remainingLongOperationElementsToDelete, needToClearDeleteSelectionAsync],
      () => {
        if (
          remainingLongOperationElementsToDelete.value === 0 &&
          needToClearDeleteSelectionAsync.value === true
        ) {
          needToClearDeleteSelectionAsync.value = false;
          clearSelection();
          refreshContent();
          cancelLongOperationBlockingStatus();
          cancelItemsInteractionBlocking();

          showToast(getTranslation("save_game_explorer.deleted_elements"));
        }
      }
    );

    watch(
      [remainingLongOperationElementsToCopy, needToClearCopySelectionAsync],
      () => {
        if (
          remainingLongOperationElementsToCopy.value === 0 &&
          needToClearCopySelectionAsync.value === true
        ) {
          needToClearCopySelectionAsync.value = false;

          refreshContent();
          cancelLongOperationBlockingStatus();

          showToast(getTranslation("save_game_explorer.copied_elements"));
        }
      }
    );

    return {
      simpleDialog,
      handleError,
      handleNewPath,
      getTranslation,
      cancelExplorer,
      save,
      filename,
      explorer,
      folder,
      copy,
      cut,
      create,
      clipboard,
      stopCircle,
      trash,
      addFolderRequest,
      currentPathString,
      renameRequest,
      updateSelectedItemsCount,
      handleSelectedChanged,
      newFolderButtonVisible,
      renameButtonVisible,
      copyButtonVisible,
      pasteButtonVisible,
      copySelection,
      pasteSelection,
      cancelSelection,
      deleteSelection,
      blockingItemsSelection,
      longOperationPending,
    };
  },
  components: {
    IonSpinner,
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