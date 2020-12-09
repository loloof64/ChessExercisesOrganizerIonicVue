<template>
  <div
    class="simple_history_root"
    :style="[
      {
        width: sizePixels(historySize()),
        height: sizePixels(historySize()),
      },
    ]"
  ></div>
</template>

<script>
export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
  },
  setup(props) {
    function historySize() {
      const { sizePx } = props;
      return sizePx;
    }

    function sizePixels(historySizePx) {
      const sizePx = historySizePx;
      return sizePx + "px";
    }

    return {
      historySize,
      sizePixels,
    };
  },
};
</script>

<style scoped>
.simple_history_root {
  background-color: coral;
}
</style>