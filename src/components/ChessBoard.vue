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
import { reactive, onMounted } from "vue";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";
import useChessBoardGraphic from "@/hooks/ChessBoardGraphic";
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
      isEmptyCell,
      isWhiteTurn,
      piecesValues,
      getRank,
      getFile,
    } = useChessBoardLogic();

    const dndState = reactive({
      started: false,
      startFile: null,
      startRank: null,
      endFile: null,
      endRank: null,
      draggedPieceX: null,
      draggedPieceY: null,
      draggedPieceSrc: null,
    });

    function resetDndState() {
      dndState.started = false;
      dndState.startFile = null;
      dndState.startRank = null;
      dndState.endFile = null;
      dndState.endRank = null;
      dndState.draggedPieceX = null;
      dndState.draggedPieceY = null;
      dndState.draggedPieceSrc = null;
    }

    function handleDragStart(detail) {
      const rootEl = document.querySelector(".board_root");
      const x = detail.currentX - rootEl.offsetLeft;
      const y = detail.currentY - rootEl.offsetTop;

      const cellsSize = props.sizePx / 9.0;
      const col = Math.floor((x - cellsSize * 0.5) / cellsSize);
      const row = Math.floor((y - cellsSize * 0.5) / cellsSize);

      const file = props.reversed ? 7 - col : col;
      const rank = props.reversed ? row : 7 - row;
      if (file < 0 || file > 7 || rank < 0 || rank > 7) return;
      const cellValue = piecesValues.raws[rank][file];

      if ([undefined, null].includes(cellValue)) return;
      const isWhitePiece = ["P", "N", "B", "R", "Q", "K"].includes(cellValue);
      const isBlackPiece = ["p", "n", "b", "r", "q", "k"].includes(cellValue);
      const whiteInTurn = isWhiteTurn();
      const isPlayerInTurnPiece =
        (whiteInTurn && isWhitePiece) || (!whiteInTurn && isBlackPiece);

      if (!isPlayerInTurnPiece) return;

      dndState.started = true;

      dndState.startFile = file;
      dndState.startRank = rank;

      dndState.draggedPieceX = x - cellsSize * 0.5;
      dndState.draggedPieceY = y - cellsSize * 0.5;

      dndState.draggedPieceSrc = piecesValues.paths[rank][file];
    }

    function handleDragEnd() {
      resetDndState();
    }

    function handleDragMove(detail) {
      if (!dndState.started) return;

      const rootEl = document.querySelector(".board_root");
      const x = detail.currentX - rootEl.offsetLeft;
      const y = detail.currentY - rootEl.offsetTop;

      const cellsSize = props.sizePx / 9.0;
      const col = Math.floor((x - cellsSize * 0.5) / cellsSize);
      const row = Math.floor((y - cellsSize * 0.5) / cellsSize);

      const file = props.reversed ? 7 - col : col;
      const rank = props.reversed ? row : 7 - row;

      dndState.endFile = file;
      dndState.endRank = rank;

      dndState.draggedPieceX = x - cellsSize * 0.5;
      dndState.draggedPieceY = y - cellsSize * 0.5;
    }

    function handleDragLeave() {
      if (!dndState.started) return;
      resetDndState();
    }

    onMounted(function () {
      const boardGesture = createGesture({
        el: document.querySelector(".board_dnd_layer"),
        onStart: handleDragStart,
        onEnd: handleDragEnd,
        onMove: handleDragMove,
        threshold: 0,
      });

      boardGesture.enable();
    });

    return {
      boardSize,
      sizePixels,
      cellsSizePixels,
      piecesValues,
      isEmptyCell,
      getFile,
      getRank,
      handleDragStart,
      handleDragEnd,
      handleDragMove,
      handleDragLeave,
      dndState,
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}
</style>