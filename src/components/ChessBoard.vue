<template>
  <div id="root" :style="{ width: sizePixels, height: sizePixels }">
    <div class="cellsRow" v-for="row in [0,1,2,3,4,5,6,7]" :key="'row_' + row">
      <div
        v-for="col in [0,1,2,3,4,5,6,7]"
        :key="'cell_' + row + col"
        :class="cellBackgroundClass(row, col)"
        :style="[cellStyle, cellLocationStyle(row, col)]"
      ></div>
    </div>
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
    function truncatedSize() {
        const { sizePx } = props;
        return sizePx - sizePx%9;
    }
    const sizePixels = computed(function () {
      const sizePx = truncatedSize();
      return sizePx + "px";
    });
    const cellStyle = computed(function () {
      const sizePx = truncatedSize();
      const cellsSize = Math.floor(sizePx / 9.0);
      const cellsSizePx = cellsSize + "px";
      return {
        position: "absolute",
        display: "inline-block",
        width: cellsSizePx,
        height: cellsSizePx,
      };
    });

    function cellLocationStyle(row, col) {
      const sizePx = truncatedSize();
      const cellsSize = sizePx / 9.0;

      const left = Math.floor(cellsSize * (0.5 + col)) + "px";
      const top = Math.floor(cellsSize * (0.5 + row)) + "px";

      return {
        left,
        top,
      };
    }

    function cellBackgroundClass(row, col) {
      const isWhiteCell = (row + col) % 2 == 0;
      return isWhiteCell ? "whiteCell" : "blackCell";
    }
    return { sizePixels, cellStyle, cellBackgroundClass, cellLocationStyle };
  },
};
</script>

<style lang="scss" scoped>
#root {
  background-color: olivedrab;
}

.cellsRow {
  position: absolute;
}

.whiteCell {
  background-color: navajowhite;
}

.blackCell {
  background-color: peru;
}
</style>