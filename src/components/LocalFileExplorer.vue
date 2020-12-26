<template>
  <div class="root">
    <div class="path">{{ currentPathString }}</div>
    <div class="item" v-for="singleItem in items" :key="keyFor(singleItem)">
      <ion-img class="icon" :src="imageFor(singleItem)"></ion-img>
      <div class="filename">{{ nameFor(singleItem) }}</div>
    </div>
  </div>
</template>

<script>
import { onMounted, computed, ref } from "vue";
import { IonImg } from "@ionic/vue";
import { FilesystemDirectory, Plugins } from "@capacitor/core";
const { Filesystem } = Plugins;
import useTranslationUtils from "@/hooks/TranslationUtils";

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
            if (fst.type === 'goBack') return -1;
            if (snd.type === 'goBack') return 1;
            if (fst.type === "folder" && snd.type === "file") return -1;
            if (fst.type === "file" && snd.type === "folder") return 1;
            return fst.name.toLowerCase().localeCompare(snd.name.toLowerCase());
          });

        items.value = content;
      } catch (err) {
        console.error(err);
        emit("error", getTranslation("local_explorer.loading_content_error"));
      }
    }

    function getCurrentFolder() {
      return currentFolder.value;
    }

    const currentPathString = computed(() => {
      return `${getTranslation("local_explorer.path_prefix")}`;
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

    return {
      currentPathString,
      currentFolder,
      getCurrentFolder,
      items,
      keyFor,
      imageFor,
      nameFor,
    };
  },
  components: {
    IonImg,
  },
};
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  background-color: white;
}

.path {
  width: 100%;
  font-size: 1.1em;
  font-family: serif;
  background-color: khaki;
  overflow: scroll;
}

.item {
  width: 100%;
  height: 18vw;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid black;
}

.item > .icon {
  width: 14vw;
  height: 14vw;
  margin: 4vw;
}

.item > .filename {
  font-size: 0.8em;
}
</style>