<template>
  <div class="root">
    <div class="path">{{currentPathString}}</div>
  </div>
</template>

<script>
import { onMounted, computed, ref } from "vue";
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
  setup(props) {
    const { getTranslation, initTranslationsUtils } = useTranslationUtils();
    initTranslationsUtils();

    const currentFolder = ref(props.path);

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

    function getCurrentFolder() {
      return currentFolder.value
    }

    const currentPathString = computed(() => {
      return `${getTranslation("local_explorer.path_prefix")}`;
    });

    return {
      currentPathString,
      currentFolder,
      getCurrentFolder,
    };
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
</style>