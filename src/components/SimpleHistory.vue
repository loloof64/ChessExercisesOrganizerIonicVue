<template>
  <div
    class="simple_history_root"
    :style="[
      {
        width: sizePixels(historySize()),
        height: sizePixels(historySize()),
      },
    ]"
  >
    <span
      class="element"
      v-for="(singleElement, index) in elements"
      :key="index"
      >{{ singleElement.fan }}</span
    >
  </div>
</template>

<script>
import { reactive } from "vue";
export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
  },
  setup(props) {
    const elements = reactive([]);

    function historySize() {
      const { sizePx } = props;
      return sizePx;
    }

    function sizePixels(historySizePx) {
      const sizePx = historySizePx;
      return sizePx + "px";
    }

    function addMove(moveData) {
      elements.push(moveData);
    }

    return {
      historySize,
      sizePixels,
      elements,
      addMove,
    };
  },
};
</script>

<style scoped>
.simple_history_root {
  background-color: coral;
  overflow: scroll;
}

.element {
  color: blue;
  margin: 0 0.4em;
  white-space:nowrap;
}
</style>