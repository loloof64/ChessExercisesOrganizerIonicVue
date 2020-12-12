<template>
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
          :src="getPiecePath(row, col)"
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
      :style="{ 'background-color': playerTurnColor }"
    ></div>
  </div>
</template>

<script>
import { computed } from "vue";
import { IonImg } from "@ionic/vue";
import useChessBoardGraphic from "@/hooks/ChessBoardGraphic";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";

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
    dragAndDropCoordinates: {
      type: Object,
      default: () => {
        return {};
      },
    },
    whiteTurn: {
      type: Boolean,
      default: true,
    },
    piecesValues: {
      type: Array,
      default: () => {
        return undefined;
      },
    },
    piecesPaths: {
      type: Array,
      default: () => {
        return undefined;
      },
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
      coordinatesFontSize,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
      cellBackgroundClass,
    } = useChessBoardGraphic();

    const { getFile, getRank } = useChessBoardLogic();

    const playerTurnColor = computed(() => {
      return props.whiteTurn ? "white" : "black";
    });

    function cellBackgroundClassHighlightingOverride(row, col) {
      const file = props.reversed ? 7 - col : col;
      const rank = props.reversed ? row : 7 - row;
      const standardBackgroundClass = cellBackgroundClass(row, col);
      const isDndCrossCell =
        file === props.dragAndDropCoordinates.endFile ||
        rank === props.dragAndDropCoordinates.endRank;
      const isStartDndCell =
        file === props.dragAndDropCoordinates.startFile &&
        rank === props.dragAndDropCoordinates.startRank;
      const isEndDndCell =
        file === props.dragAndDropCoordinates.endFile &&
        rank === props.dragAndDropCoordinates.endRank;

      let cellClass = standardBackgroundClass;
      if (isDndCrossCell) cellClass = "dndCrossCell";
      if (isStartDndCell) cellClass = "dndStartCell";
      if (isEndDndCell) cellClass = "dndEndCell";
      return cellClass;
    }

    function isEmptyCell(rank, file) {
      return props.piecesValues[rank][file] === undefined;
    }

    function mustShowPiece(row, col) {
      const file = getFile(col, props.reversed);
      const rank = getRank(row, props.reversed);

      const isTheDraggedPiece =
        file === props.dragAndDropCoordinates.startFile &&
        rank === props.dragAndDropCoordinates.startRank;

      if (isTheDraggedPiece) return false;

      return !isEmptyCell(rank, file);
    }

    function getPiecePath(row, col) {
      return props.piecesPaths[getRank(row, props.reversed)][
        getFile(col, props.reversed)
      ];
    }

    return {
      boardSize,
      sizePixels,
      coordinatesFontSize,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
      cellBackgroundClassHighlightingOverride,
      mustShowPiece,
      playerTurnColor,
      getPiecePath,
    };
  },
};
</script>

<style>
.board_main_layer {
  position: absolute;
  left: 0;
  top: 0;
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
</style>