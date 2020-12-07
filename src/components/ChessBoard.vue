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
      @commitPromotion="(type) => terminatePromotionMove({ type, makeMove })"
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
      getGameStatus,
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

    function requestPromotionSelection() {
      promotionDialogWhitePlayer.value = isWhiteTurn.value;
      promotionDialogOpen.value = true;
    }

    function cancelPromotionSelection() {
      resetDndState();
      promotionDialogOpen.value = false;
    }

    onMounted(function () {
      const boardGesture = createGesture({
        el: document.querySelector(".board_dnd_layer"),
        onStart: (detail) =>
          handleDragStart({
            detail,
            boardSizePx: props.sizePx,
            reversed: props.reversed,
            piecesValues,
            piecesPaths,
            whiteTurn: isWhiteTurn.value,
          }),
        onEnd: () => {
          handleDragEnd({
            isLegalMove,
            makeMove,
            isPromotionMove,
            requestPromotionSelection,
          });
          emitEndGameStatusIfAppropriate();
        },
        onMove: (detail) =>
          handleDragMove({
            detail,
            boardSizePx: props.sizePx,
            reversed: props.reversed,
          }),
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

    startNewGame();

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
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}
</style>