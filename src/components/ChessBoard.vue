<template>
  <div
    class="board_root"
    :style="[
      {
        width: sizePixels(boardSize()),
        height: sizePixels(boardSize()),
      },
    ]"
  >
    <ChessBoardMainLayer
      :sizePx="sizePx"
      :reversed="reversed"
      :dragAndDropCoordinates="{
        startFile: dndState.startFile,
        startRank: dndState.startRank,
        endFile: dndState.endFile,
        endRank: dndState.endRank,
      }"
      :whiteTurn="isWhiteTurn"
      :piecesValues="piecesValues"
      :piecesPaths="piecesPaths"
    />

    <ChessBoardArrowLayer
      :sizePx="sizePx"
      :reversed="reversed"
      :fromFile="arrowFromFile"
      :fromRank="arrowFromRank"
      :toFile="arrowToFile"
      :toRank="arrowToRank"
    />

    <ChessBoardDndLayer
      :sizePx="sizePx"
      :reversed="reversed"
      :dndState="dndState"
      :resetDndState="resetDndState"
    />

    <ChessBoardPromotionDialog
      :open="promotionDialogOpen"
      :sizePx="sizePx"
      :whitePlayer="promotionDialogWhitePlayer"
      @cancelMove="cancelPromotionSelection"
      @commitPromotion="
        (type) =>
          terminatePromotionMove({ type, makeMove, onPromotionMoveDone })
      "
    />
  </div>
</template>

<script>
import { createGesture } from "@ionic/vue";
import { ref, reactive, onMounted, watch } from "vue";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";
import useChessBoardGraphic from "@/hooks/ChessBoardGraphic";
import useChessBoardDragAndDrop from "@/hooks/ChessBoardDragAndDrop";
import ChessBoardMainLayer from "@/components/ChessBoardMainLayer";
import ChessBoardArrowLayer from "@/components/ChessBoardArrowLayer";
import ChessBoardDndLayer from "@/components/ChessBoardDndLayer";
import ChessBoardPromotionDialog from "@/components/ChessBoardPromotionDialog";

export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
    reversed: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ChessBoardMainLayer,
    ChessBoardArrowLayer,
    ChessBoardDndLayer,
    ChessBoardPromotionDialog,
  },
  setup(props, context) {
    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }

    const promotionDialogOpen = ref(false);
    const promotionDialogWhitePlayer = ref(true);

    const arrowFromFile = ref(-100);
    const arrowFromRank = ref(-100);
    const arrowToFile = ref(-100);
    const arrowToRank = ref(-100);

    const draggedPieceLocationRatio = reactive({ x: null, y: null });

    const { sizePixels, cellsSizePixels } = useChessBoardGraphic();

    const {
      piecesValues,
      piecesPaths,
      getRank,
      getFile,
      isWhiteTurn,
      isLegalMove,
      makeMove,
      isPromotionMove,
      startNewGame,
      stopCurrentGame,
      getGameStatus,
      getPositionFen,
      tryToSetupPositionFen,
      GAME_STATUS_IDLE,
      GAME_STATUS_RUNNING,
      GAME_STATUS_WHITE_WIN,
      GAME_STATUS_BLACK_WIN,
      GAME_STATUS_DRAW_STALEMATE,
      GAME_STATUS_DRAW_THREE_FOLD_REPETITION,
      GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL,
      GAME_STATUS_DRAW_FIFTY_MOVES_RULE,
    } = useChessBoardLogic();

    const {
      dndState,
      resetDndState,
      handleDragStart,
      handleDragMove,
      handleDragEnd,
      terminatePromotionMove,
    } = useChessBoardDragAndDrop();

    function emitEndGameStatusIfAppropriate() {
      const currentStatus = getGameStatus();
      switch (currentStatus) {
        case GAME_STATUS_WHITE_WIN:
          context.emit("win", true);
          break;
        case GAME_STATUS_BLACK_WIN:
          context.emit("win", false);
          break;
        case GAME_STATUS_DRAW_STALEMATE:
          context.emit("stalemate");
          break;
        case GAME_STATUS_DRAW_THREE_FOLD_REPETITION:
          context.emit("three-fold-repetition");
          break;
        case GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL:
          context.emit("insufficient-material");
          break;
        case GAME_STATUS_DRAW_FIFTY_MOVES_RULE:
          context.emit("fifty-moves");
          break;
      }
    }

    function gameIsInProgress() {
      return getGameStatus() === GAME_STATUS_RUNNING;
    }

    function gameIsIdle() {
      return getGameStatus() === GAME_STATUS_IDLE;
    }

    // If the game has been stopped for whatever reason, and so the user may need to review the moves.
    function gameIsStalled() {
      const gameStatus = getGameStatus();
      return (
        gameStatus != GAME_STATUS_IDLE && gameStatus != GAME_STATUS_RUNNING
      );
    }

    function requestPromotionSelection() {
      promotionDialogWhitePlayer.value = isWhiteTurn.value;
      promotionDialogOpen.value = true;
    }

    function cancelPromotionSelection() {
      resetDndState();
      promotionDialogOpen.value = false;
    }

    function convertSanToFan({ moveSan, whiteTurn }) {
      moveSan = moveSan
        .replace(/K/g, whiteTurn ? "\u2654" : "\u265A")
        .normalize("NFKC");
      moveSan = moveSan
        .replace(/Q/g, whiteTurn ? "\u2655" : "\u265B")
        .normalize("NFKC");
      moveSan = moveSan
        .replace(/R/g, whiteTurn ? "\u2656" : "\u265C")
        .normalize("NFKC");
      moveSan = moveSan
        .replace(/B/g, whiteTurn ? "\u2657" : "\u265D")
        .normalize("NFKC");
      moveSan = moveSan
        .replace(/N/g, whiteTurn ? "\u2658" : "\u265E")
        .normalize("NFKC");

      return moveSan;
    }

    function onPromotionMoveDone(san) {
      const whiteTurnBeforeMove = !isWhiteTurn.value;
      const fan = convertSanToFan({
        moveSan: san,
        whiteTurn: whiteTurnBeforeMove,
      });
      const positionFen = getPositionFen();
      const lastMoveArrow = {
        fromFile: arrowFromFile.value,
        fromRank: arrowFromRank.value,
        toFile: arrowToFile.value,
        toRank: arrowToRank.value,
      };

      //////////////////////////////
      console.log("lastMoveArrow", lastMoveArrow);
      ///////////////////////////////

      context.emit("move-done", {
        fan,
        positionFen,
        blackTurnBeforeMove: !whiteTurnBeforeMove,
        lastMoveArrow,
      });
      emitEndGameStatusIfAppropriate();
    }

    function tryToLoadPosition(fen) {
      return tryToSetupPositionFen(fen);
    }

    onMounted(function () {
      const boardGesture = createGesture({
        el: document.querySelector(".board_dnd_layer"),
        onStart: (detail) => {
          if (getGameStatus() !== GAME_STATUS_RUNNING) return;
          handleDragStart({
            detail,
            boardSizePx: props.sizePx,
            reversed: props.reversed,
            piecesValues,
            piecesPaths,
            whiteTurn: isWhiteTurn.value,
          });
        },
        onEnd: () => {
          if (getGameStatus() !== GAME_STATUS_RUNNING) return;
          const whiteTurnBeforeMove = isWhiteTurn.value;
          const { san, lastMoveCoordinates, isPromotion } = handleDragEnd({
            isLegalMove,
            makeMove,
            isPromotionMove,
            requestPromotionSelection,
          });

          const moveValidated = san !== undefined;
          if (moveValidated) {
            const fan = convertSanToFan({
              moveSan: san,
              whiteTurn: whiteTurnBeforeMove,
            });
            const positionFen = getPositionFen();

            arrowFromFile.value = lastMoveCoordinates.fromFile;
            arrowFromRank.value = lastMoveCoordinates.fromRank;
            arrowToFile.value = lastMoveCoordinates.toFile;
            arrowToRank.value = lastMoveCoordinates.toRank;

            const lastMoveArrow = {
              fromFile: arrowFromFile.value,
              fromRank: arrowFromRank.value,
              toFile: arrowToFile.value,
              toRank: arrowToRank.value,
            };
            context.emit("move-done", {
              fan,
              fen: positionFen,
              blackTurnBeforeMove: isWhiteTurn.value,
              lastMoveArrow,
            });
          } else if (isPromotion) {
            arrowFromFile.value = lastMoveCoordinates.startFile;
            arrowFromRank.value = lastMoveCoordinates.startRank;
            arrowToFile.value = lastMoveCoordinates.endFile;
            arrowToRank.value = lastMoveCoordinates.endRank;
          }
          emitEndGameStatusIfAppropriate();
        },
        onMove: (detail) => {
          if (getGameStatus() !== GAME_STATUS_RUNNING) return;
          handleDragMove({
            detail,
            boardSizePx: props.sizePx,
            reversed: props.reversed,
          });
        },
        threshold: 0,
      });

      boardGesture.enable();
    });

    function getLocationRatio(locationPx) {
      return locationPx / props.sizePx;
    }

    function getLocationPxFromRatio(locationRatio) {
      return props.sizePx * locationRatio;
    }

    function adaptDraggedPieceLocationForReversedConfiguration() {
      const locationRatioX = getLocationRatio(dndState.draggedPieceX);
      const locationRatioY = getLocationRatio(dndState.draggedPieceY);

      const newLocationRationX = 1 - locationRatioX - 0.1111;
      const newLocationRationY = 1 - locationRatioY - 0.1111;

      const newDraggedPieceX = getLocationPxFromRatio(newLocationRationX);
      const newDraggedPieceY = getLocationPxFromRatio(newLocationRationY);

      dndState.draggedPieceX = newDraggedPieceX;
      dndState.draggedPieceY = newDraggedPieceY;
    }

    function adaptDraggedPieceLocationForResizedConfiguration() {
      const newDraggedPieceX = getLocationPxFromRatio(
        draggedPieceLocationRatio.x
      );
      const newDraggedPieceY = getLocationPxFromRatio(
        draggedPieceLocationRatio.y
      );

      dndState.draggedPieceX = newDraggedPieceX;
      dndState.draggedPieceY = newDraggedPieceY;
    }

    watch([() => props.reversed], () => {
      adaptDraggedPieceLocationForReversedConfiguration();
    });

    watch([() => props.sizePx], () => {
      adaptDraggedPieceLocationForResizedConfiguration();
    });

    watch([() => dndState.draggedPieceX], () => {
      if (dndState.draggedPieceX === null) draggedPieceLocationRatio.x = null;
      else
        draggedPieceLocationRatio.x = getLocationRatio(dndState.draggedPieceX);
    });

    watch([() => dndState.draggedPieceY], () => {
      if (dndState.draggedPieceY === null) draggedPieceLocationRatio.y = null;
      else
        draggedPieceLocationRatio.y = getLocationRatio(dndState.draggedPieceY);
    });

    return {
      boardSize,
      sizePixels,
      cellsSizePixels,
      piecesValues,
      piecesPaths,
      getFile,
      getRank,
      handleDragStart,
      handleDragEnd,
      handleDragMove,
      dndState,
      isWhiteTurn,
      promotionDialogOpen,
      promotionDialogWhitePlayer,
      cancelPromotionSelection,
      terminatePromotionMove,
      makeMove,
      resetDndState,
      startNewGame,
      stopCurrentGame,
      getGameStatus,
      gameIsInProgress,
      gameIsIdle,
      gameIsStalled,
      onPromotionMoveDone,
      tryToLoadPosition,
      arrowFromFile,
      arrowFromRank,
      arrowToFile,
      arrowToRank,
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}
</style>