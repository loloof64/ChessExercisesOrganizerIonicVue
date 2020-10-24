<template>
  <div
    id="root"
    :style="[
      {
        width: sizePixels,
        height: sizePixels,
      },
    ]"
  >
    <div></div>
    <div
      v-for="col in [0, 1, 2, 3, 4, 5, 6, 7]"
      :key="'top_coord_' + col"
      class="coordinate"
      :style="{ 'font-size': coordinatesFontSize }"
    >
      {{ topBottomCoordinateValue(col) }}
    </div>
    <div></div>

    <template v-for="row in [0, 1, 2, 3, 4, 5, 6, 7]" :key="'row_' + row">
      <div class="coordinate" :style="{ 'font-size': coordinatesFontSize }">
        {{ leftRightCoordinateValue(row) }}
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
          :width="cellsSizePixels"
          :height="cellsSizePixels"
        ></ion-img>
      </div>
      <div class="coordinate" :style="{ 'font-size': coordinatesFontSize }">
        {{ leftRightCoordinateValue(row) }}
      </div>
    </template>

    <div></div>
    <div
      v-for="col in [0, 1, 2, 3, 4, 5, 6, 7]"
      :key="'bottom_coord_' + col"
      class="coordinate"
      :style="{ 'font-size': coordinatesFontSize }"
    >
      {{ topBottomCoordinateValue(col) }}
    </div>
    <div
      class="playerTurn"
      :style="{ 'background-color': playerTurnColor() }"
    ></div>
  </div>
</template>

<script>
import { IonImg } from "@ionic/vue";
import { computed } from "vue";
import useChessBoardLogic from "../hooks/ChessBoardLogic";

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

    const sizePixels = computed(function () {
      const sizePx = boardSize();
      return sizePx + "px";
    });

    const cellsSizePixels = computed(function () {
      const sizePx = boardSize();
      const cellsSizePx = sizePx / 9.0 + "px";
      return cellsSizePx;
    });

    const coordinatesFontSize = computed(function () {
      const cellsSize = props.sizePx / 9.0;
      return Math.floor(cellsSize * 0.4) + "px";
    });

    function topBottomCoordinateValue(col) {
      const possibleValues = props.reversed ? "HGFEDCBA" : "ABCDEFGH";
      return possibleValues.charAt(col);
    }

    function leftRightCoordinateValue(row) {
      const possibleValues = props.reversed ? "12345678" : "87654321";
      return possibleValues.charAt(row);
    }

    function cellBackgroundClass(row, col) {
      const isWhiteCell = (row + col) % 2 == 0;
      return isWhiteCell ? "whiteCell" : "blackCell";
    }

    const {
      startNewGame,
      isEmptyCell,
      playerTurnColor,
      piecesValues,
      getRank,
      getFile,
    } = useChessBoardLogic();

    startNewGame(
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"
    );

    return {
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