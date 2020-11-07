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
      @commitPromotion="(type) => terminatePromotionMove({type, makeMove})"
    />
  </div>
</template>

<script>
import { createGesture } from "@ionic/vue";
import { ref, onMounted } from "vue";
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
  components: { ChessBoardMainLayer, ChessBoardDndLayer, ChessBoardPromotionDialog },
  setup(props) {
    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }

    const promotionDialogOpen = ref(false);
    const promotionDialogWhitePlayer = ref(true);

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
    } = useChessBoardLogic();

    const {
      dndState,
      resetDndState,
      handleDragStart,
      handleDragMove,
      handleDragEnd,
      terminatePromotionMove,
    } = useChessBoardDragAndDrop();

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
        onEnd: () =>
          handleDragEnd({
            isLegalMove,
            makeMove,
            isPromotionMove,
            requestPromotionSelection,
          }),
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
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}
</style>