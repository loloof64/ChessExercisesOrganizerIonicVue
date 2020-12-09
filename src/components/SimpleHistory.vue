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
      >{{ singleElement.text }}</span
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

    function startNewGame() {
        elements.splice(0, elements.length);
        elements.push({text: "1."});
    }

    function historySize() {
      const { sizePx } = props;
      return sizePx;
    }

    function sizePixels(historySizePx) {
      const sizePx = historySizePx;
      return sizePx + "px";
    }

    function addMove(moveData) {
      elements.push({text: moveData.fan});
    }

    return {
      historySize,
      sizePixels,
      elements,
      addMove,
      startNewGame,
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
  margin: 0 0.2em;
  white-space:nowrap;
}
</style>