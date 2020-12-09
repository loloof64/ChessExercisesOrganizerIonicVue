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
      @click="handleSelection(index)"
      >{{ singleElement.text }}</span
    >
  </div>
</template>

<script>
import { reactive, ref } from "vue";
export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
  },
  setup(props, context) {
    const elements = reactive([]);
    const moveNumber = ref(-1);

    function startNewGame() {
      moveNumber.value = 1;
      const text = `${moveNumber.value}.`;
      elements.splice(0, elements.length);
      elements.push({ text });
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
      elements.push({ text: moveData.fan, fen: moveData.fen });
      if (moveData.blackTurnBeforeMove) {
        moveNumber.value += 1;
        const text = `${moveNumber.value}.`;
        elements.push({ text });
      }
    }

    function handleSelection(elementIndex) {
      const element = elements[elementIndex];
      const isAMoveElement = element.fen !== undefined;
      if (isAMoveElement) {
        context.emit("selection-request", {
          index: elementIndex,
          fen: element.fen,
        });
      }
    }

    return {
      historySize,
      sizePixels,
      elements,
      addMove,
      startNewGame,
      handleSelection,
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
  white-space: nowrap;
}
</style>