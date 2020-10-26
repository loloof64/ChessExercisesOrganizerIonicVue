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
    <div
      class="board_main_layer"
      :style="[
        {
          width: sizePixels(boardSize()),
          height: sizePixels(boardSize()),
        },
      ]"
    >
      <div></div>
      <div
        v-for="col in [0, 1, 2, 3, 4, 5, 6, 7]"
        :key="'top_coord_' + col"
        class="coordinate"
        :style="{ 'font-size': coordinatesFontSize(boardSize()) }"
      >
        {{ topBottomCoordinateValue(col, reversed) }}
      </div>
      <div></div>

      <template v-for="row in [0, 1, 2, 3, 4, 5, 6, 7]" :key="'row_' + row">
        <div
          class="coordinate"
          :style="{ 'font-size': coordinatesFontSize(boardSize()) }"
        >
          {{ leftRightCoordinateValue(row, reversed) }}
        </div>
        <div
          v-for="col in [0, 1, 2, 3, 4, 5, 6, 7]"
          :key="'cell_' + row + col"
          :class="cellBackgroundClassHighlightingOverride(row, col)"
        >
          <ion-img
            v-if="mustShowPiece(row, col)"
            :src="
              piecesValues.paths[getRank(row, reversed)][getFile(col, reversed)]
            "
            :width="cellsSizePixels(boardSize())"
            :height="cellsSizePixels(boardSize())"
          ></ion-img>
        </div>
        <div
          class="coordinate"
          :style="{ 'font-size': coordinatesFontSize(boardSize()) }"
        >
          {{ leftRightCoordinateValue(row, reversed) }}
        </div>
      </template>

      <div></div>
      <div
        v-for="col in [0, 1, 2, 3, 4, 5, 6, 7]"
        :key="'bottom_coord_' + col"
        class="coordinate"
        :style="{ 'font-size': coordinatesFontSize(boardSize()) }"
      >
        {{ topBottomCoordinateValue(col, reversed) }}
      </div>
      <div
        class="playerTurn"
        :style="{ 'background-color': playerTurnColor() }"
      ></div>
    </div>

    <div
      class="board_dnd_layer"
      :style="[
        {
          width: sizePixels(boardSize()),
          height: sizePixels(boardSize()),
        },
      ]"
    >
      <div
        class="board_dragged_piece_zone"
        :style="{
          width: cellsSizePixels(boardSize()),
          height: cellsSizePixels(boardSize()),
          left: dndState.draggedPieceX + 'px',
          top: dndState.draggedPieceY + 'px',
        }"
      >
        <ion-img
          v-if="mustShowDraggedPiece()"
          :src="dndState.draggedPieceSrc"
        ></ion-img>
      </div>
    </div>
  </div>
</template>

<script>
import { IonImg, createGesture } from "@ionic/vue";
import { reactive, onMounted } from "vue";
import useChessBoardLogic from "../hooks/ChessBoardLogic";
import useChessBoardGraphic from "../hooks/ChessBoardGraphic";

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
  components: { IonImg },
  setup(props) {
    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }

    const {
      sizePixels,
      cellsSizePixels,
      coordinatesFontSize,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
      cellBackgroundClass,
    } = useChessBoardGraphic();

    const {
      startNewGame,
      isEmptyCell,
      isWhiteTurn,
      piecesValues,
      getRank,
      getFile,
    } = useChessBoardLogic();

    function playerTurnColor() {
      return isWhiteTurn() ? "white" : "black";
    }

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

    function handleDragStart(detail)  {
      const rootEl = document.querySelector(".board_root");
      const x = detail.currentX - rootEl.offsetLeft;
      const y = detail.currentY - rootEl.offsetTop;

      const cellsSize = props.sizePx / 9.0;
      const col = Math.floor((x - cellsSize * 0.5) / cellsSize);
      const row = Math.floor((y - cellsSize * 0.5) / cellsSize);

      const file = props.reversed ? 7 - col : col;
      const rank = props.reversed ? row : 7 - row;
      const cellValue = piecesValues.raws[rank][file];

      if ([undefined, null].includes(cellValue)) return;
      const isWhitePiece = ["P", "N", "B", "R", "Q", "K"].includes(cellValue);
      const isBlackPiece = ["p", "n", "b", "r" , "q", "k"].includes(cellValue);
      const whiteInTurn = isWhiteTurn();
      const isPlayerInTurnPiece = (whiteInTurn && isWhitePiece) || (!whiteInTurn && isBlackPiece);

      if (!isPlayerInTurnPiece) return;

      dndState.started = true;

      dndState.startFile = file;
      dndState.startRank = rank;

      dndState.draggedPieceX = x - cellsSize * 0.5;
      dndState.draggedPieceY = y - cellsSize * 0.5;

      dndState.draggedPieceSrc =
        piecesValues.paths[rank][file];
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

    function cellBackgroundClassHighlightingOverride(row, col) {
      const file = props.reversed ? 7 - col : col;
      const rank = props.reversed ? row : 7 - row;
      const standardBackgroundClass = cellBackgroundClass(row, col);
      const isDndCrossCell =
        file === dndState.endFile || rank === dndState.endRank;
      const isStartDndCell =
        file === dndState.startFile && rank === dndState.startRank;
      const isEndDndCell =
        file === dndState.endFile && rank === dndState.endRank;

      if (isEndDndCell) return "dndEndCell";
      if (isDndCrossCell) return "dndCrossCell";
      if (isStartDndCell) return "dndStartCell";
      return standardBackgroundClass;
    }

    function mustShowPiece(row, col) {
      const file = props.reversed ? 7 - col : col;
      const rank = props.reversed ? row : 7 - row;
      const isTheDraggedPiece =
        file === dndState.startFile && rank === dndState.startRank;

      if (isTheDraggedPiece) return false;
      return !isEmptyCell(
        getRank(row, props.reversed),
        getFile(col, props.reversed)
      );
    }

    function mustShowDraggedPiece() {
      return (
        ![null, undefined].includes(dndState.draggedPieceX) &&
        ![null, undefined].includes(dndState.draggedPieceY)
      );
    }

    onMounted(function () {
      const boardGesture = createGesture({
        el: document.querySelector(".board_dnd_layer"),
        onStart: handleDragStart,
        onEnd: handleDragEnd,
        onMove: handleDragMove,
        threshold: 1,
      });

      boardGesture.enable();
    });

    startNewGame(
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"
    );

    return {
      boardSize,
      sizePixels,
      cellsSizePixels,
      coordinatesFontSize,
      cellBackgroundClass,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
      piecesValues,
      isEmptyCell,
      playerTurnColor,
      getFile,
      getRank,
      handleDragStart,
      handleDragEnd,
      handleDragMove,
      handleDragLeave,
      cellBackgroundClassHighlightingOverride,
      mustShowPiece,
      mustShowDraggedPiece,
      dndState,
    };
  },
};
</script>

<style lang="scss" scoped>
.board_root {
  position: relative;
}

.board_main_layer {
  background-color: rgb(124, 124, 124);
  display: grid;
  grid-template-rows: 1fr repeat(8, 2fr) 1fr;
  grid-template-columns: 1fr repeat(8, 2fr) 1fr;
}

.coordinate {
  color: yellow;
  display: flex;
  justify-content: center;
  align-items: center;
}

.whiteCell {
  background-color: navajowhite;
}

.blackCell {
  background-color: peru;
}

.dndCrossCell {
  background-color: blueviolet;
}

.dndStartCell {
  background-color: red;
}

.dndEndCell {
  background-color: green;
}

.playerTurn {
  border-radius: 45%;
  width: 80%;
  height: 80%;
  left: 5%;
  top: 5%;
}

.board_dnd_layer {
  position: absolute;
  left: 0;
  top: 0;
}

.board_dragged_piece_zone {
  position: absolute;
}
</style>