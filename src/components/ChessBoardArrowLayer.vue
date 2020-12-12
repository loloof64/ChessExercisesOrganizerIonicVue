<template>
  <div
    class="board_arrow_layer"
    :style="[
      {
        width: sizePixels(boardSize()),
        height: sizePixels(boardSize()),
      },
    ]"
  >
    <div v-if="active" class="arrowElt" :style="lastMoveBaseLineStyle" />
    <div v-if="active" class="arrowElt" :style="lastMoveArrow1Style" />
    <div v-if="active" class="arrowElt" :style="lastMoveArrow2Style" />
    <div v-if="active" class="arrowElt" :style="lastMovePointStyle" />
  </div>
</template>

<script>
import { reactive, ref, watch, onBeforeUnmount } from "vue";
import useChessBoardGraphic from "@/hooks/ChessBoardGraphic";

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
    fromFile: {
      type: Number,
      default: -1,
    },
    fromRank: {
      type: Number,
      default: -1,
    },
    toFile: {
      type: Number,
      default: -1,
    },
    toRank: {
      type: Number,
      default: -1,
    },
  },
  setup(props) {
    const active = ref(false);

    const lastMoveBaseLineStyle = reactive({});
    const lastMoveArrow1Style = reactive({});
    const lastMoveArrow2Style = reactive({});
    const lastMovePointStyle = reactive({});

    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }

    const { sizePixels } = useChessBoardGraphic();

    function updateActiveState() {
      if (props.fromFile < 0) active.value = false;
      if (props.fromRank < 0) active.value = false;
      if (props.toFile < 0) active.value = false;
      if (props.toRank < 0) active.value = false;

      active.value = true;
    }

    function updateArrowBaseLine({ ax, ay, bx, by, halfThicknessPx }) {
      const realAx = ax - halfThicknessPx;
      const realAy = ay;
      const realBx = bx - halfThicknessPx;
      const realBy = by;

      const vectX = realBx - realAx;
      const vectY = realBy - realAy;

      const angleRad = Math.atan2(vectY, vectX) - Math.PI / 2.0;
      const length = Math.sqrt(vectX * vectX + vectY * vectY);

      const left = realAx;
      const top = realAy;
      const width = 2 * halfThicknessPx;
      const height = length;
      const transformOrigin = `${halfThicknessPx}px ${0}px`;
      const transform = `rotate(${angleRad}rad)`;

      lastMoveBaseLineStyle.width = `${width}px`;
      lastMoveBaseLineStyle.height = `${height}px`;
      lastMoveBaseLineStyle.left = `${left}px`;
      lastMoveBaseLineStyle.top = `${top}px`;
      lastMoveBaseLineStyle["transform"] = transform;
      lastMoveBaseLineStyle["-ms-transform"] = transform;
      lastMoveBaseLineStyle["-moz-transform"] = transform;
      lastMoveBaseLineStyle["-webkit-transform"] = transform;
      lastMoveBaseLineStyle["transform-origin"] = transformOrigin;
      lastMoveBaseLineStyle["-ms-transform-origin"] = transformOrigin;
      lastMoveBaseLineStyle["-moz-transform-origin"] = transformOrigin;
      lastMoveBaseLineStyle["-webkit-transform-origin"] = transformOrigin;
    }

    function updateArrow1({ ax, ay, bx, by, halfThicknessPx }) {
      const realAx = ax - halfThicknessPx;
      const realAy = ay;
      const realBx = bx - halfThicknessPx;
      const realBy = by;

      const vectX = realBx - realAx;
      const vectY = realBy - realAy;

      const angleRad =
        Math.atan2(vectY, vectX) - Math.PI / 2.0 - (3 * Math.PI) / 4.0;
      const length = Math.sqrt(vectX * vectX + vectY * vectY) * 0.4;

      const left = realBx;
      const top = realBy;
      const width = 2 * halfThicknessPx;
      const height = length;
      const transformOrigin = `${halfThicknessPx}px ${0}px`;
      const transform = `rotate(${angleRad}rad)`;

      lastMoveArrow1Style.width = `${width}px`;
      lastMoveArrow1Style.height = `${height}px`;
      lastMoveArrow1Style.left = `${left}px`;
      lastMoveArrow1Style.top = `${top}px`;
      lastMoveArrow1Style["transform"] = transform;
      lastMoveArrow1Style["-ms-transform"] = transform;
      lastMoveArrow1Style["-moz-transform"] = transform;
      lastMoveArrow1Style["-webkit-transform"] = transform;
      lastMoveArrow1Style["transform-origin"] = transformOrigin;
      lastMoveArrow1Style["-ms-transform-origin"] = transformOrigin;
      lastMoveArrow1Style["-moz-transform-origin"] = transformOrigin;
      lastMoveArrow1Style["-webkit-transform-origin"] = transformOrigin;
    }

    function updateArrow2({ ax, ay, bx, by, halfThicknessPx }) {
      const realAx = ax - halfThicknessPx;
      const realAy = ay;
      const realBx = bx - halfThicknessPx;
      const realBy = by;

      const vectX = realBx - realAx;
      const vectY = realBy - realAy;

      const angleRad =
        Math.atan2(vectY, vectX) - Math.PI / 2.0 + (3 * Math.PI) / 4.0;
      const length = Math.sqrt(vectX * vectX + vectY * vectY) * 0.4;

      const left = realBx;
      const top = realBy;
      const width = 2 * halfThicknessPx;
      const height = length;
      const transformOrigin = `${halfThicknessPx}px ${0}px`;
      const transform = `rotate(${angleRad}rad)`;

      lastMoveArrow2Style.width = `${width}px`;
      lastMoveArrow2Style.height = `${height}px`;
      lastMoveArrow2Style.left = `${left}px`;
      lastMoveArrow2Style.top = `${top}px`;
      lastMoveArrow2Style["transform"] = transform;
      lastMoveArrow2Style["-ms-transform"] = transform;
      lastMoveArrow2Style["-moz-transform"] = transform;
      lastMoveArrow2Style["-webkit-transform"] = transform;
      lastMoveArrow2Style["transform-origin"] = transformOrigin;
      lastMoveArrow2Style["-ms-transform-origin"] = transformOrigin;
      lastMoveArrow2Style["-moz-transform-origin"] = transformOrigin;
      lastMoveArrow2Style["-webkit-transform-origin"] = transformOrigin;
    }

    function updateArrowPoint({ ax, ay, bx, by, halfThicknessPx }) {
      const realAx = ax - halfThicknessPx;
      const realAy = ay;
      const realBx = bx - halfThicknessPx;
      const realBy = by - halfThicknessPx;

      const vectX = realBx - realAx;
      const vectY = realBy - realAy;

      const angleRad = Math.atan2(vectY, vectX) + Math.PI / 4.0;
      const length = 2 * halfThicknessPx;

      const left = realBx;
      const top = realBy;
      const width = 2 * halfThicknessPx;
      const height = length;
      const transformOrigin = "center";
      const transform = `rotate(${angleRad}rad)`;

      lastMovePointStyle.width = `${width}px`;
      lastMovePointStyle.height = `${height}px`;
      lastMovePointStyle.left = `${left}px`;
      lastMovePointStyle.top = `${top}px`;
      lastMovePointStyle["transform"] = transform;
      lastMovePointStyle["-ms-transform"] = transform;
      lastMovePointStyle["-moz-transform"] = transform;
      lastMovePointStyle["-webkit-transform"] = transform;
      lastMovePointStyle["transform-origin"] = transformOrigin;
      lastMovePointStyle["-ms-transform-origin"] = transformOrigin;
      lastMovePointStyle["-moz-transform-origin"] = transformOrigin;
      lastMovePointStyle["-webkit-transform-origin"] = transformOrigin;
    }

    function computeArrowBaseCoordinates() {
      const cellSizePx = props.sizePx / 9.0;

      const fromCol = props.reversed ? 7 - props.fromFile : props.fromFile;
      const fromRow = props.reversed ? props.fromRank : 7 - props.fromRank;
      const toCol = props.reversed ? 7 - props.toFile : props.toFile;
      const toRow = props.reversed ? props.toRank : 7 - props.toRank;

      const ax = cellSizePx * (fromCol + 1.0);
      const ay = cellSizePx * (fromRow + 1.0);
      const bx = cellSizePx * (toCol + 1.0);
      const by = cellSizePx * (toRow + 1.0);

      return {
        ax,
        ay,
        bx,
        by,
      };
    }

    function updateArrow() {
      if (active.value === false) return;

      const cellSizePx = props.sizePx / 9.0;
      const halfThicknessPx = cellSizePx * 0.08;
      const { ax, ay, bx, by } = computeArrowBaseCoordinates();
      updateArrowBaseLine({ ax, ay, bx, by, halfThicknessPx });
      updateArrow1({ ax, ay, bx, by, halfThicknessPx });
      updateArrow2({ ax, ay, bx, by, halfThicknessPx });
      updateArrowPoint({ ax, ay, bx, by, halfThicknessPx });
    }

    watch(
      [
        () => props.fromFile,
        () => props.fromRank,
        () => props.toFile,
        () => props.toRank,
      ],
      () => {
        updateActiveState();
        updateArrow();
      }
    );

    updateActiveState();
    updateArrow();

    window.addEventListener("orientationchange", updateArrow);

    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", updateArrow);
    });

    return {
      boardSize,
      lastMoveBaseLineStyle,
      lastMoveArrow1Style,
      lastMoveArrow2Style,
      lastMovePointStyle,
      sizePixels,
      active,
    };
  },
};
</script>

<style>
.board_arrow_layer {
  position: absolute;
  left: 0;
  top: 0;
}

.arrowElt {
  position: absolute;
  background-color: blue;
}
</style>