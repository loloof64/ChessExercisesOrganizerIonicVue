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
    />
  </div>
</template>

<script>
import { createGesture } from "@ionic/vue";
import { onMounted } from "vue";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";
import useChessBoardGraphic from "@/hooks/ChessBoardGraphic";
import useChessBoardDragAndDrop from "@/hooks/ChessBoardDragAndDrop";
import ChessBoardMainLayer from "@/components/ChessBoardMainLayer";
import ChessBoardDndLayer from "@/components/ChessBoardDndLayer";

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
  components: { ChessBoardMainLayer, ChessBoardDndLayer },
  setup(props) {
    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }

    const { sizePixels, cellsSizePixels } = useChessBoardGraphic();

    const {
      piecesValues,
      piecesPaths,
      getRank,
      getFile,
      isWhiteTurn,
      isLegalMove,
      makeMove,
    } = useChessBoardLogic();

    const {
      dndState,
      handleDragStart,
      handleDragMove,
      handleDragEnd,
    } = useChessBoardDragAndDrop();

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
        onEnd: () => handleDragEnd({
          isLegalMove,
          makeMove,
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
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}
</style>