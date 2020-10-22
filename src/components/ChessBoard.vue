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
      ></div>
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
import { computed } from "vue";
export default {
  props: {
    sizePx: {
      type: Number,
      default: 60,
    },
  },
  setup(props) {
    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }
    const sizePixels = computed(function () {
      const sizePx = boardSize();
      return sizePx + "px";
    });

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
    return {
      sizePixels,
      coordinatesFontSize,
      cellBackgroundClass,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
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