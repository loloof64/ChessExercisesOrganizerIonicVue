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
          display: buttonsDisplay,
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
    navigationBarVisible: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    IonIcon,
  },
  setup(props, context) {
    const elements = ref([]);
    const moveNumber = ref(-1);
    const selectedIndex = ref(-1);
    const nextElementToAddIndex = ref(0);
    const gameStartFen = ref("error");

    const gameFinished = ref(false);

    const gameData = ref(null);
    const solutionData = ref(null);
    const solutionActive = ref(false);

    const singleNavigationButtonStyle = reactive({
      "background-color": "yellowgreen",
    });

    function startNewGame(
      startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      solution = {}
    ) {
      solutionActive.value = false;
      gameFinished.value = false;
      solutionData.value = solution;
      gameData.value = null;
      const blackTurnAtStart = startFen.split(" ")[1] === "b";
      moveNumber.value = parseInt(startFen.split(" ")[5]);
      selectedIndex.value = -1;
      gameStartFen.value = startFen;
      nextElementToAddIndex.value = 0;
      const text = `${moveNumber.value}.${blackTurnAtStart ? ".." : ""}`;
      elements.value.splice(0, elements.value.length);
      pushElementAndUpdateIndex({ text });
    }

    function terminateGame() {
      gameFinished.value = true;
      gameData.value = {
        startPosition: gameStartFen.value,
        elements: elements.value,
      };
    }

    function isSolutionActive() {
      return solutionActive.value;
    }

    function toggleBetweenSolutionAndGame() {
      if (!gameFinished.value) return;

      const solutionMovesCount = solutionData.value.elements.filter(
        (item) => item.fen !== undefined
      ).length;
      const noSolution = solutionMovesCount === 0;
      if (noSolution) return;

      const mustShowSolution = !solutionActive.value;
      if (mustShowSolution) {
        gameStartFen.value = solutionData.value.startPosition;
        elements.value = [...solutionData.value.elements];
      } else {
        gameStartFen.value = gameData.value.startPosition;
        elements.value = [...gameData.value.elements];
      }

      selectedIndex.value = -1;
      solutionActive.value = !solutionActive.value;
      navigateToStartPositionIfPossible();
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
      if (gameFinished.value) return;
      elements.value.push({
        ...elementToAdd,
        index: nextElementToAddIndex.value,
      });
      nextElementToAddIndex.value += 1;
    }

    function addMove(moveData) {
      pushElementAndUpdateIndex({
        text: moveData.fan,
        fen: moveData.fen,
        lastMoveArrow: moveData.lastMoveArrow,
      });
      if (gameFinished.value) return;
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
      const element = elements.value[elementIndex];
      const isAMoveElement = element.fen !== undefined;

      if (isAMoveElement) {
        context.emit("selection-request", {
          index: elementIndex,
          fen: element.fen,
        });
      }
    }

    function navigateToLastMoveIfPossible() {
      const historyMoves = elements.value.filter(
        (item) => ["(", ")"].includes(item.text) || item.fen !== undefined
      );
      if (historyMoves.length > 0) {
        let previousElementIndex = historyMoves.length - 1;
        let lastHistoryElement;
        let variationLevel = 0;

        for (;;) {
          const previousElement = historyMoves[previousElementIndex];

          const isAMove = previousElement.fen !== undefined;
          const isStartOfVariation = previousElement.text === "(";
          const isEndOfVariation = previousElement.text === ")";
          const isAtRootVariation = variationLevel === 0;

          if (isEndOfVariation) variationLevel -= 1;
          else if (isStartOfVariation) variationLevel += 1;
          if (variationLevel > 0) throw "Too much '(' symbols.";

          if (isAMove && isAtRootVariation) {
            lastHistoryElement = previousElement;
            break;
          }

          previousElementIndex -= 1;
        }

        context.emit("selection-request", {
          ...lastHistoryElement,
        });
      }
    }

    function navigateToStartPositionIfPossible() {
      context.emit("selection-request", { fen: gameStartFen.value, index: -1 });
    }

    function navigateToNextMoveIfPossible() {
      const historyMoves = elements.value.filter(
        (item) => ["(", ")"].includes(item.text) || item.fen !== undefined
      );

      if (selectedIndex.value < 0) {
        if (historyMoves.length === 0) return;
        const nextHistoryMoveElement = historyMoves[0];
        const hasOnlyVariations = nextHistoryMoveElement.text === "(";
        if (hasOnlyVariations) return;
        context.emit("selection-request", { ...nextHistoryMoveElement });
      } else {
        const currentOverallElement = elements.value[selectedIndex.value];
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

        let variationLevel = 0;
        let nextHistoryElementIndex = currentHistoryMovesElementIndex + 1;
        let nextHistoryMoveElement;
        for (;;) {
          const nextElement = historyMoves[nextHistoryElementIndex];

          const isAMove = nextElement.fen !== undefined;
          const isStartOfVariation = nextElement.text === "(";
          const isEndOfVariation = nextElement.text === ")";
          const isAtRootVariation = variationLevel === 0;

          if (isStartOfVariation) variationLevel += 1;
          else if (isEndOfVariation) variationLevel -= 1;
          if (variationLevel < 0) throw "End of variation.";

          if (isAMove && isAtRootVariation) {
            nextHistoryMoveElement = nextElement;
            break;
          }

          nextHistoryElementIndex += 1;
        }
        context.emit("selection-request", { ...nextHistoryMoveElement });
      }
    }
    function navigateToPreviousHistoryMoveIfPossible() {
      const historyMoves = elements.value.filter(
        (item) => ["(", ")"].includes(item.text) || item.fen !== undefined
      );
      const currentlyOnTheFirstNodeOrAtStart = selectedIndex.value <= 1;
      if (currentlyOnTheFirstNodeOrAtStart) {
        context.emit("selection-request", {
          fen: gameStartFen.value,
          index: -1,
        });
      } else {
        const currentOverallElement = elements.value[selectedIndex.value];
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

        let variationLevel = 0;
        let previousHistoryElementIndex = currentHistoryMovesElementIndex - 1;
        let previousHistoryMoveElement;
        for (;;) {
          const previousElement = historyMoves[previousHistoryElementIndex];

          const isAMove = previousElement.fen !== undefined;
          const isStartOfVariation = previousElement.text === "(";
          const isEndOfVariation = previousElement.text === ")";
          const isAtRootVariation = variationLevel === 0;

          if (isEndOfVariation) variationLevel -= 1;
          else if (isStartOfVariation) variationLevel += 1;
          if (variationLevel > 0) throw "Start of variation.";

          if (isAMove && isAtRootVariation) {
            previousHistoryMoveElement = previousElement;
            break;
          }

          previousHistoryElementIndex -= 1;
        }

        context.emit("selection-request", { ...previousHistoryMoveElement });
      }
    }

    function commitSelection(elementIndex) {
      if (!gameFinished.value) return;
      selectedIndex.value = elementIndex;

      function scrollToSelectedElement() {
        // Scroll in order to show selected element.
        const nodeToShow = document.querySelector(
          ".simple_history_root .movesZone .highlighted"
        );
        const movesZone = document.querySelector(".movesZone");
        if (elementIndex > 0) {
          if (nodeToShow) {
            nodeToShow.setAttribute("tabindex", "-1");
            nodeToShow.focus();
            nodeToShow.removeAttribute("tabindex");
          } else {
            movesZone.scrollTo({
              left: 0,
              top: movesZoneHeight,
              behavior: "smooth",
            });
          }
        } else {
          movesZone.scrollTo({
            left: 0,
            top: 0,
            behavior: "smooth",
          });
        }
      }

      scrollToSelectedElement();
    }

    function selectLastHistoryMoveIfThereIsOne() {
      const historyMoves = elements.value.filter(
        (item) => item.fen !== undefined
      );
      if (historyMoves.length > 0) {
        const lastHistoryElement = historyMoves[historyMoves.length - 1];
        const lastHistoryIndex = elements.value.indexOf(lastHistoryElement);
        selectedIndex.value = lastHistoryIndex;
      }
    }

    function isLastElement(nodeIndex) {
      return nodeIndex === elements.value.length - 1;
    }

    function getSelectedMoveArrow() {
      if (selectedIndex.value < 0) return undefined;
      const selectedElement = elements.value[selectedIndex.value];
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

    const buttonsDisplay = computed(() => {
      return props.navigationBarVisible ? "flex" : "none";
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
      buttonsDisplay,
      terminateGame,
      toggleBetweenSolutionAndGame,
      isSolutionActive,
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