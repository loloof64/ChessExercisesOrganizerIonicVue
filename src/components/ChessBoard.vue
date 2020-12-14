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
import Hammer from "hammerjs";
import { ref, reactive, onMounted, watch, onBeforeUnmount } from "vue";
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
      resetPlayerTypes,
      isHumanTurn,
      isExternalTurn,
      makeExternalMove,
      GAME_STATUS_IDLE,
      GAME_STATUS_RUNNING,
      GAME_STATUS_WHITE_WIN,
      GAME_STATUS_BLACK_WIN,
      GAME_STATUS_DRAW_STALEMATE,
      GAME_STATUS_DRAW_THREE_FOLD_REPETITION,
      GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL,
      GAME_STATUS_DRAW_FIFTY_MOVES_RULE,
      PLAYER_TYPE_HUMAN,
    } = useChessBoardLogic();

    const {
      dndState,
      resetDndState,
      handleDragStart,
      handleDragMove,
      handleDragEnd,
      handleDragCancel,
      terminatePromotionMove,
    } = useChessBoardDragAndDrop();

    function emitEndGameStatusIfAppropriate() {
      const currentStatus = getGameStatus();
      switch (currentStatus) {
        case GAME_STATUS_WHITE_WIN:
          resetPlayerTypes();
          context.emit("win", true);
          break;
        case GAME_STATUS_BLACK_WIN:
          resetPlayerTypes();
          context.emit("win", false);
          break;
        case GAME_STATUS_DRAW_STALEMATE:
          resetPlayerTypes();
          context.emit("stalemate");
          break;
        case GAME_STATUS_DRAW_THREE_FOLD_REPETITION:
          resetPlayerTypes();
          context.emit("three-fold-repetition");
          break;
        case GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL:
          resetPlayerTypes();
          context.emit("insufficient-material");
          break;
        case GAME_STATUS_DRAW_FIFTY_MOVES_RULE:
          resetPlayerTypes();
          context.emit("fifty-moves");
          break;
        default:
          emitExternalTurnIfAppropriate();
      }
    }

    function letUserStartANewGame(
      startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      whitePlayerType = PLAYER_TYPE_HUMAN,
      blackPlayerType = PLAYER_TYPE_HUMAN
    ) {
      arrowFromFile.value = -100;
      arrowFromRank.value = -100;
      arrowToFile.value = -100;
      arrowToRank.value = -100;

      startNewGame(startPosition, whitePlayerType, blackPlayerType);
      emitExternalTurnIfAppropriate();
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

    function externalTurn() {
      return isExternalTurn();
    }

    function emitExternalTurnIfAppropriate() {
      if (isExternalTurn()) {
        const currentPositionFen = getPositionFen();
        context.emit("external-turn", currentPositionFen);
      }
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

      context.emit("move-done", {
        fan,
        fen: positionFen,
        blackTurnBeforeMove: !whiteTurnBeforeMove,
        lastMoveArrow,
      });
      emitEndGameStatusIfAppropriate();
    }

    function tryToMakeExternalMove({
      startFile,
      startRank,
      endFile,
      endRank,
      promotion,
    }) {
      const { san, positionFen, lastMoveArrow } = makeExternalMove({
        startFile,
        startRank,
        endFile,
        endRank,
        promotion,
      });
      const invalidMove = san === undefined;
      if (invalidMove) return;

      const fan = convertSanToFan({
        moveSan: san,
        whiteTurn: !isWhiteTurn.value,
      });
      context.emit("move-done", {
        fan,
        fen: positionFen,
        blackTurnBeforeMove: isWhiteTurn.value,
        lastMoveArrow,
      });
      emitEndGameStatusIfAppropriate();
    }

    function tryToLoadPosition(fen) {
      return tryToSetupPositionFen(fen);
    }

    function tryToSetLastMoveArrow({ startFile, startRank, endFile, endRank }) {
      if (gameIsStalled() || isExternalTurn()) {
        arrowFromFile.value = startFile;
        arrowFromRank.value = startRank;
        arrowToFile.value = endFile;
        arrowToRank.value = endRank;
      }
    }

    function onPanStart(detail) {
      if (getGameStatus() !== GAME_STATUS_RUNNING) return;
      if (!isHumanTurn()) return;
      handleDragStart({
        detail,
        boardSizePx: props.sizePx,
        reversed: props.reversed,
        piecesValues,
        piecesPaths,
        whiteTurn: isWhiteTurn.value,
      });
    }

    function onPanMove(detail) {
      if (getGameStatus() !== GAME_STATUS_RUNNING) return;
      if (!isHumanTurn()) return;
      handleDragMove({
        detail,
        boardSizePx: props.sizePx,
        reversed: props.reversed,
      });
    }

    function onPanEnd() {
      if (getGameStatus() !== GAME_STATUS_RUNNING) return;
      if (!isHumanTurn()) return;
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
    }

    function onPanCancel() {
      if (getGameStatus() !== GAME_STATUS_RUNNING) return;
      if (!isHumanTurn()) return;
      handleDragCancel();
    }

    onMounted(function () {
      const boardGesture = new Hammer(
        document.querySelector(".board_dnd_layer")
      );

      boardGesture.get("tap").set({ enable: false });
      boardGesture.get("rotate").set({ enable: false });
      boardGesture.get("pinch").set({ enable: false });
      boardGesture.get("swipe").set({ enable: false });

      boardGesture
        .get("pan")
        .set({ direction: Hammer.DIRECTION_ALL, threshold: 0 });
      boardGesture.on("panstart", onPanStart);
      boardGesture.on("panleft panright panup pandown", onPanMove);
      boardGesture.on("panend", onPanEnd);
      boardGesture.on("pancancel", onPanCancel);
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

    function clearDraggedImage() {
      dndState.draggedPieceSrc = null;
      dndState.draggedPieceX = null;
      dndState.draggedPieceY = null;
    }

    window.addEventListener("orientationchange", clearDraggedImage);

    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", clearDraggedImage);
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
      letUserStartANewGame,
      stopCurrentGame,
      getGameStatus,
      gameIsInProgress,
      gameIsIdle,
      gameIsStalled,
      onPromotionMoveDone,
      tryToLoadPosition,
      tryToSetLastMoveArrow,
      arrowFromFile,
      arrowFromRank,
      arrowToFile,
      arrowToRank,
      tryToMakeExternalMove,
      externalTurn,
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}
</style>