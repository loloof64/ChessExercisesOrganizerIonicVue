<template>
  <div class="root"></div>
</template>

<script>

export default {
  props: {
    directory: {
      type: String,
      required: true,
    },
    path:  {
      type: String,
      required: true,
    },
  },
  setup() {
  
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