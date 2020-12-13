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
        @click="navigateToStartPositionIfPossible"
      />
      <ion-icon
        :icon="playBackCircleOutline"
        :style="singleNavigationButtonStyle"
        @click="navigateToPreviousHistoryMoveIfPossible"
      />
      <ion-icon
        :icon="playForwardCircleOutline"
        :style="singleNavigationButtonStyle"
        @click="navigateToNextMoveIfPossible"
      />
      <ion-icon
        :icon="playSkipForwardCircleOutline"
        :style="singleNavigationButtonStyle"
        @click="navigateToLastMoveIfPossible"
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
          last: isLastElement(index),
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
import { reactive, ref, computed, onBeforeUnmount } from "vue";
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
    const nextElementToAddIndex = ref(0);
    const gameStartFen = ref("error");

    const singleNavigationButtonStyle = reactive({
      "background-color": "yellowgreen",
    });

    function startNewGame(
      startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ) {
      moveNumber.value = 1;
      selectedIndex.value = -1;
      gameStartFen.value = startFen;
      nextElementToAddIndex.value = 0;
      const text = `${moveNumber.value}.`;
      elements.splice(0, elements.length);
      pushElementAndUpdateIndex({ text });
    }

    function historySize() {
      const { sizePx } = props;
      return sizePx;
    }

    function sizePixels(historySizePx) {
      const sizePx = historySizePx;
      return sizePx + "px";
    }

    function pushElementAndUpdateIndex(elementToAdd) {
      elements.push({ ...elementToAdd, index: nextElementToAddIndex.value });
      nextElementToAddIndex.value += 1;
    }

    function addMove(moveData) {
      pushElementAndUpdateIndex({
        text: moveData.fan,
        fen: moveData.fen,
        lastMoveArrow: moveData.lastMoveArrow,
      });
      if (moveData.blackTurnBeforeMove) {
        moveNumber.value += 1;
        const text = `${moveNumber.value}.`;
        pushElementAndUpdateIndex({ text });
      }

      // Scroll in order to show last element.
      const nodeToShow = document.querySelector(
        ".simple_history_root .movesZone .last"
      );
      if (nodeToShow) {
        nodeToShow.setAttribute("tabindex", "-1");
        nodeToShow.focus();
        nodeToShow.removeAttribute("tabindex");
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

    function navigateToLastMoveIfPossible() {
      const historyMoves = elements.filter((item) => item.fen !== undefined);
      if (historyMoves.length > 0) {
        const lastHistoryElement = historyMoves[historyMoves.length - 1];
        const lastHistoryIndex = elements.indexOf(lastHistoryElement);
        context.emit("selection-request", {
          ...lastHistoryElement,
          index: lastHistoryIndex,
        });
      }
    }

    function navigateToStartPositionIfPossible() {
      context.emit("selection-request", { fen: gameStartFen.value, index: -1 });
    }

    function navigateToNextMoveIfPossible() {
      const historyMoves = elements.filter((item) => item.fen !== undefined);
      if (selectedIndex.value < 0) {
        if (historyMoves.length === 0) return;
        const nextHistoryMoveElement = historyMoves[0];
        context.emit("selection-request", { ...nextHistoryMoveElement });
      } else {
        const currentOverallElement = elements[selectedIndex.value];
        const currentHistoryMovesElementIndex = historyMoves.findIndex(
          (item) => {
            return (
              item.fen === currentOverallElement.fen &&
              item.text === currentOverallElement.text &&
              item.lastMoveArrow === currentOverallElement.lastMoveArrow &&
              item.index === currentOverallElement.index
            );
          }
        );

        const elementNotFoundInHistoryMoves =
          currentHistoryMovesElementIndex < 0;
        if (elementNotFoundInHistoryMoves) return;

        const noMoreElementInHistoryMoves =
          currentHistoryMovesElementIndex >= historyMoves.length - 1;
        if (noMoreElementInHistoryMoves) return;

        const nextHistoryMoveElement =
          historyMoves[currentHistoryMovesElementIndex + 1];
        context.emit("selection-request", { ...nextHistoryMoveElement });
      }
    }
    function navigateToPreviousHistoryMoveIfPossible() {
      const historyMoves = elements.filter((item) => item.fen !== undefined);
      const currentlyOnTheFirstNodeOrAtStart = selectedIndex.value <= 1;
      if (currentlyOnTheFirstNodeOrAtStart) {
        context.emit("selection-request", {
          fen: gameStartFen.value,
          index: -1,
        });
      } else {
        const currentOverallElement = elements[selectedIndex.value];
        const currentHistoryMovesElementIndex = historyMoves.findIndex(
          (item) => {
            return (
              item.fen === currentOverallElement.fen &&
              item.text === currentOverallElement.text &&
              item.lastMoveArrow === currentOverallElement.lastMoveArrow &&
              item.index === currentOverallElement.index
            );
          }
        );

        const elementNotFoundInHistoryMoves =
          currentHistoryMovesElementIndex < 0;
        if (elementNotFoundInHistoryMoves) return;

        const noMoreElementInHistoryMoves =
          currentHistoryMovesElementIndex <= 0;
        if (noMoreElementInHistoryMoves) return;

        const previousHistoryMoveElement =
          historyMoves[currentHistoryMovesElementIndex - 1];
        context.emit("selection-request", { ...previousHistoryMoveElement });
      }
    }

    function commitSelection(elementIndex) {
      selectedIndex.value = elementIndex;

      // Scroll in order to show selected element.
      const nodeToShow = document.querySelector(
        ".simple_history_root .movesZone .highlighted"
      );
      if (nodeToShow) {
        nodeToShow.setAttribute("tabindex", "-1");
        nodeToShow.focus();
        nodeToShow.removeAttribute("tabindex");
      }
    }

    function selectLastHistoryMoveIfThereIsOne() {
      const historyMoves = elements.filter((item) => item.fen !== undefined);
      if (historyMoves.length > 0) {
        const lastHistoryElement = historyMoves[historyMoves.length - 1];
        const lastHistoryIndex = elements.indexOf(lastHistoryElement);
        selectedIndex.value = lastHistoryIndex;
      }
    }

    function isLastElement(nodeIndex) {
      return nodeIndex === elements.length - 1;
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
        singleNavigationButtonStyle.width = "6 vw";
        singleNavigationButtonStyle.height = "6 vw";
      } else {
        singleNavigationButtonStyle.width = "6.2 vh";
        singleNavigationButtonStyle.height = "6.2 vh";
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
      window.removeEventListener(
        "orientationchange",
        computeNavigationButtonsStyle
      );
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
      navigateToStartPositionIfPossible,
      navigateToPreviousHistoryMoveIfPossible,
      navigateToNextMoveIfPossible,
      navigateToLastMoveIfPossible,
      isLastElement,
    };
  },
};
</script>

<style scoped>
.movesZone {
  background-color: coral;
  overflow: scroll;
}

.element {
  display: inline-block;
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