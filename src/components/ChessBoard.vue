<template>
  <div
    id="root"
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
        :class="cellBackgroundClass(row, col)"
      >
        <ion-img
          v-if="!isEmptyCell(getRank(row, reversed), getFile(col, reversed))"
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
</template>

<script>
import { IonImg } from "@ionic/vue";
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
    };
  },
};
</script>

<style lang="scss" scoped>
#root {
  background-color: olivedrab;
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

.playerTurn {
  border-radius: 45%;
  width: 80%;
  height: 80%;
  left: 5%;
  top: 5%;
}
</style>