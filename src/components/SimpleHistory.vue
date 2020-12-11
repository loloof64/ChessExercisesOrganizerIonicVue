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
    <div
      class="navigationButtons"
      :style="[
        {
          width: sizePixels(historySize()),
          height: sizePixels(navigationHeight),
        },
      ]"
    >
      <ion-icon
        :icon="playSkipBackCircleOutline"
        :style="singleNavigationButtonStyle"
      />
      <ion-icon :icon="playBackCircleOutline" :style="singleNavigationButtonStyle" />
      <ion-icon
        :icon="playForwardCircleOutline"
        :style="singleNavigationButtonStyle"
      />
      <ion-icon
        :icon="playSkipForwardCircleOutline"
        :style="singleNavigationButtonStyle"
      />
    </div>

    <div
      class="movesZone"
      :style="[
        {
          width: sizePixels(historySize()),
          height: sizePixels(movesZoneHeight),
        },
      ]"
    >
      <span
        class="element"
        :class="{
          highlighted: selectedIndex === index,
        }"
        v-for="(singleElement, index) in elements"
        :key="index"
        @click="handleSelection(index)"
        >{{ singleElement.text }}</span
      >
    </div>
  </div>
</template>

<script>
import { reactive, ref,  computed, onBeforeUnmount } from "vue";
import { IonIcon } from "@ionic/vue";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import {
  playBackCircleOutline,
  playSkipBackCircleOutline,
  playForwardCircleOutline,
  playSkipForwardCircleOutline,
} from "ionicons/icons";
export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
  },
  components: {
    IonIcon,
  },
  setup(props, context) {
    const elements = reactive([]);
    const moveNumber = ref(-1);
    const selectedIndex = ref(-1);

    const singleNavigationButtonStyle = reactive({
      'background-color': 'yellowgreen',
    });

    function startNewGame() {
      moveNumber.value = 1;
      selectedIndex.value = -1;
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
      elements.push({
        text: moveData.fan,
        fen: moveData.fen,
        lastMoveArrow: moveData.lastMoveArrow,
      });
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

    function commitSelection(elementIndex) {
      selectedIndex.value = elementIndex;
    }

    function selectLastHistoryMoveIfThereIsOne() {
      const historyMoves = elements.filter((item) => item.fen !== undefined);
      if (historyMoves.length > 0) {
        const lastHistoryElement = historyMoves[historyMoves.length - 1];
        const lastHistoryIndex = elements.indexOf(lastHistoryElement);
        selectedIndex.value = lastHistoryIndex;
      }
    }

    function getSelectedMoveArrow() {
      if (selectedIndex.value < 0) return undefined;
      const selectedElement = elements[selectedIndex.value];
      return selectedElement.lastMoveArrow;
    }

    function computeNavigationButtonsStyle() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");
      if (isPortrait) {
        singleNavigationButtonStyle.width = '6 vw';
        singleNavigationButtonStyle.height = '6 vw';
      }
      else {
        singleNavigationButtonStyle.width = '6.2 vh';
        singleNavigationButtonStyle.height = '6.2 vh';
      }
    }

    const navigationHeight = computed(() => {
      return props.sizePx * 0.1;
    });

    const movesZoneHeight = computed(() => {
      return props.sizePx * 0.9;
    });

    window.addEventListener("orientationchange", computeNavigationButtonsStyle);

    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", computeNavigationButtonsStyle);
    });

    computeNavigationButtonsStyle();

    return {
      historySize,
      sizePixels,
      elements,
      addMove,
      startNewGame,
      handleSelection,
      commitSelection,
      selectedIndex,
      selectLastHistoryMoveIfThereIsOne,
      getSelectedMoveArrow,
      IonIcon,
      playBackCircleOutline,
      playSkipBackCircleOutline,
      playForwardCircleOutline,
      playSkipForwardCircleOutline,
      navigationHeight,
      movesZoneHeight,
      singleNavigationButtonStyle,
    };
  },
};
</script>

<style scoped>
.simple_history_root {
}

.movesZone {
  background-color: coral;
  overflow: scroll;
}

.element {
  color: blue;
  margin: 0 0.2em;
  white-space: nowrap;
}

.element.highlighted {
  background-color: yellow;
}

.navigationButtons {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  background-color: rgba(57, 16, 243);
}
</style>