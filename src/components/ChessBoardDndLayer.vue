<template>
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
</template>

<script>
import { IonImg } from "@ionic/vue";
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
    dndState: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  components: { IonImg },
  setup(props) {
    function boardSize() {
      const { sizePx } = props;
      return sizePx;
    }

    const { sizePixels, cellsSizePixels } = useChessBoardGraphic();

    function mustShowDraggedPiece() {
      return (
        ![null, undefined].includes(props.dndState.draggedPieceX) &&
        ![null, undefined].includes(props.dndState.draggedPieceY)
      );
    }

    return {
      boardSize,
      sizePixels,
      cellsSizePixels,
      mustShowDraggedPiece,
    };
  },
};
</script>

<style>
.board_dnd_layer {
  position: absolute;
  left: 0;
  top: 0;
}

.board_dragged_piece_zone {
  position: absolute;
}
</style>