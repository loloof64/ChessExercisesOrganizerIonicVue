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
          v-if="!isEmptyCell(row, col)"
          :src="getPiecePath(row, col)"
          :width="cellsSizePixels"
          :height="cellsSizePixels"></ion-img>
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
    <div></div>
  </div>
</template>

<script>
import {IonImg} from '@ionic/vue';
import { reactive, computed, watch } from "vue";
import Chess from "chess.js";

export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
  },
  components: {IonImg},
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

    const game = reactive({
      handler: new Chess("8/8/8/8/8/8/8/8 w - - 0 1"),
    });

    const piecesValues = reactive({
      handler: [],
    });

    function startNewGame(
      startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ) {
      game.handler = new Chess(startPosition);
    }

    function getPiecesValues() {
      const currentPosition = game.handler.fen();
      const boardValues = currentPosition.split(" ")[0].split("/").reverse();

      const result = [];

      for (let rank = 0; rank < 8; rank++) {
        const line = [];

        let file = 0;
        let charPosition = 0;

        while (file < 8) {
          const currentValue = boardValues[rank][charPosition];
          const valueAsDigit = currentValue.charCodeAt(0) - "0".charCodeAt(0);
          const isCorrectDigitValue = valueAsDigit >= 0 && valueAsDigit <= 9;

          if (isCorrectDigitValue) {
            // clearing as many cells as valueAsDigit requires
            for (let i = 0; i < valueAsDigit; i++) {
              line.push(undefined);
              file++;
            }
          } else {
            line.push(currentValue);
            file++;
          }

          charPosition++;
        }

        result.push(line);
      }

      return result.reverse();
    }

    const coordinatesFontSize = computed(function () {
      return Math.floor(sizePixels.value * 0.5) + "px";
    });

    function topBottomCoordinateValue(col) {
      return "ABCDEFGH".charAt(col);
    }

    function leftRightCoordinateValue(row) {
      return "87654321".charAt(row);
    }

    function cellBackgroundClass(row, col) {
      const isWhiteCell = (row + col) % 2 == 0;
      return isWhiteCell ? "whiteCell" : "blackCell";
    }

    function getRank(row) {
      return row;
    }

    function getFile(col) {
      return col;
    }

    function getPieceRawPath(value) {
      let rawImageName;
      switch (value) {
        case "P":
          rawImageName = "Chess_plt45.svg";
          break;
        case "N":
          rawImageName = "Chess_nlt45.svg";
          break;
        case "B":
          rawImageName = "Chess_blt45.svg";
          break;
        case "R":
          rawImageName = "Chess_rlt45.svg";
          break;
        case "Q":
          rawImageName = "Chess_qlt45.svg";
          break;
        case "K":
          rawImageName = "Chess_klt45.svg";
          break;

        case "p":
          rawImageName = "Chess_pdt45.svg";
          break;
        case "n":
          rawImageName = "Chess_ndt45.svg";
          break;
        case "b":
          rawImageName = "Chess_bdt45.svg";
          break;
        case "r":
          rawImageName = "Chess_rdt45.svg";
          break;
        case "q":
          rawImageName = "Chess_qdt45.svg";
          break;
        case "k":
          rawImageName = "Chess_kdt45.svg";
          break;
        default:
          return undefined;
      }

      return `/assets/chess_vectors/${rawImageName}`;
    }

    watch(game, function () {
      piecesValues.handler = getPiecesValues();
    });

    function getPiecePath(row, col) {
      const pieceValue = piecesValues.handler[getRank(row)][getFile(col)];
      return getPieceRawPath(pieceValue);
    }

    function isEmptyCell(row, col) {
      return !getPiecePath(row, col);
    }

    startNewGame();

    return {
      sizePixels,
      cellsSizePixels,
      coordinatesFontSize,
      cellBackgroundClass,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
      getPiecePath,
      isEmptyCell,
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
</style>