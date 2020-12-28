<template>
  <div class="root">
    <explorer-item
      v-for="singleItem in items"
      :key="keyFor(singleItem)"
      @click="handleItemClick"
      :type="singleItem.type"
      :name="nameFor(singleItem)"
      :image="imageFor(singleItem)"
      :selected="isItemSelected(singleItem)"
      @selected-changed="handleSelectedChanged(singleItem)"
    />
  </div>
</template>

<script>
import { onMounted, computed, ref } from "vue";
import { FilesystemDirectory, Plugins } from "@capacitor/core";
const { Filesystem } = Plugins;
import useTranslationUtils from "@/hooks/TranslationUtils";
import ExplorerItem from "@/components/file-explorer/ExplorerItem";

export default {
  props: {
    path: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const currentFolder = ref(props.path);
    const items = ref([]);
    const selectedItems = ref([]);

    onMounted(async () => {
      try {
        await Filesystem.mkdir({
          path: props.path,
          directory: FilesystemDirectory.Documents,
          recursive: true,
        });
      } catch (err) {
        console.error(err);
      }
    });

    onMounted(refreshContent);

    async function refreshContent() {
      try {
        const files = await Filesystem.readdir({
          path: currentFolder.value,
          directory: FilesystemDirectory.Documents,
        });

        const content = files.files
          .map((item) => {
            const isAFile = item.includes(".") > 0;
            const isAPgn = item.endsWith(".pgn");

            if (isAFile) {
              return isAPgn
                ? {
                    type: "file",
                    name: item,
                  }
                : undefined;
            } else {
              return {
                type: "folder",
                name: item,
              };
            }
          })
          .filter((item) => item !== undefined)
          .sort((fst, snd) => {
            if (fst.type === "goBack") return -1;
            if (snd.type === "goBack") return 1;
            if (fst.type === "folder" && snd.type === "file") return -1;
            if (fst.type === "file" && snd.type === "folder") return 1;
            return fst.name.toLowerCase().localeCompare(snd.name.toLowerCase());
          });

        items.value = content;

        const weAreInNotRoot = currentFolder.value !== props.path;
        if (weAreInNotRoot) {
          items.value.unshift({
            type: "goBack",
          });
        }
      } catch (err) {
        console.error(err);
        emit("error", getTranslation("local_explorer.loading_content_error"));
      }
    }

    function getCurrentFolder() {
      return currentFolder.value;
    }

    const currentPathString = computed(() => {
      return `${getTranslation("local_explorer.path_prefix")}/${
        currentFolder.value
      }`;
    });

    function keyFor(item) {
      return `${item.type}_${item.name}`;
    }

    function imageFor(item) {
      switch (item.type) {
        case "goBack":
          return "/assets/icon/folder.svg";
        case "folder":
          return "/assets/icon/folder.svg";
        default:
          return "/assets/icon/file.svg";
      }
    }

    function nameFor(item) {
      if (item.type === "goBack") return "..";
      return item.name;
    }

    function isItemSelected(item) {
      const itemPath = `${currentFolder.value}/${item.name}`;
      return (
        selectedItems.value.find((elt) => elt.path === itemPath) !== undefined
      );
    }

    function handleItemClick(item) {
      try {
        if (item.type === "goBack") {
          const lastSlashIndex = currentFolder.value.lastIndexOf("/");
          const strippedPath = currentFolder.value.slice(0, lastSlashIndex);
          currentFolder.value = strippedPath;
          refreshContent();
          emit("new-path", currentPathString.value);
        } else if (item.type === "folder") {
          currentFolder.value += "/" + item.name;
          refreshContent();
          emit("new-path", currentPathString.value);
        }
      } catch (err) {
        console.error(err);
      }
    }

    function handleSelectedChanged(item) {
      const itemPath = `${currentFolder.value}/${item.name}`;
      const itemIndex = selectedItems.value.findIndex(
        (elt) => elt.path === itemPath && elt.type === item.type
      );

      const newStateIsSelected = itemIndex < 0;

      emit("selected-changed", {
        item,
        newSelectedState: newStateIsSelected,
      });

      if (!newStateIsSelected) {
        selectedItems.value.splice(itemIndex, 1);
      } else {
        selectedItems.value.push({ ...item, path: itemPath });
      }
    }

    function getSelectedItems() {
      return selectedItems.value;
    }

    function clearSelectedItems() {
      selectedItems.value = [];
    }

    onMounted(() => {
      emit("new-path", currentPathString.value);
    });

    return {
      currentPathString,
      currentFolder,
      getCurrentFolder,
      refreshContent,
      handleItemClick,
      items,
      keyFor,
      imageFor,
      nameFor,
      handleSelectedChanged,
      getSelectedItems,
      clearSelectedItems,
      isItemSelected,
    };
  },
  components: {
    ExplorerItem,
  },
};
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  background-color: white;
}
</style>