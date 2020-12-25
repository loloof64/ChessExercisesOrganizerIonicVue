<template>
  <div class="root"></div>
</template>

<script>
import { onMounted } from "vue";
import { FilesystemDirectory, Plugins } from "@capacitor/core";
const { Filesystem } = Plugins;
export default {
  props: {
    path: {
      type: String,
      required: true,
    },
  },
  setup(props) {
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

    return {};
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