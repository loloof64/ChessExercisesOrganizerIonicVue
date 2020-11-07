<template>
  <div id="root" v-if="open" @click="cancelMove">
    <div id="content">
      <div>Select the promotion piece</div>
      <div id="buttons_zone">
        <div class="single-button" :style="[{
          width: buttonsSize,
          height: buttonsSize,
        }]" @click="commitPromotion('q')">
          <ion-img :src="queenPath" />
        </div>
        <div class="single-button" :style="[{
          width: buttonsSize,
          height: buttonsSize,
        }]" @click="commitPromotion('r')">
          <ion-img :src="rookPath" />
        </div>

        <div class="single-button" :style="[{
          width: buttonsSize,
          height: buttonsSize,
        }]" @click="commitPromotion('b')">
          <ion-img :src="bishopPath" />
        </div>

         <div class="single-button" :style="[{
          width: buttonsSize,
          height: buttonsSize,
        }]" @click="commitPromotion('n')">
          <ion-img :src="knightPath" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { IonImg } from "@ionic/vue";
export default {
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    sizePx: {
      type: Number,
      default: 60,
    },
    whitePlayer: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    IonImg,
  },
  setup(props, context) {
    function completeImagePath(baseName) {
      return "/assets/chess_vectors/" + baseName;
    }

    const queenPath = computed(() => {
      const baseName = props.whitePlayer
        ? "Chess_qlt45.svg"
        : "Chess_qdt45.svg";
      return completeImagePath(baseName);
    });

    const rookPath = computed(() => {
      const baseName = props.whitePlayer
        ? "Chess_rlt45.svg"
        : "Chess_rdt45.svg";
      return completeImagePath(baseName);
    });

    const bishopPath = computed(() => {
      const baseName = props.whitePlayer
        ? "Chess_blt45.svg"
        : "Chess_bdt45.svg";
      return completeImagePath(baseName);
    });

    const knightPath = computed(() => {
      const baseName = props.whitePlayer
        ? "Chess_nlt45.svg"
        : "Chess_ndt45.svg";
      return completeImagePath(baseName);
    });

    const buttonsSize = computed(() => {
      return props.sizePx / 9.0 + "px";
    });

    function cancelMove() {
      context.emit('cancel-move');
    }

    function commitPromotion(type) {
      context.emit('commit-promotion', type);
    }

    return {
      buttonsSize,
      queenPath,
      rookPath,
      bishopPath,
      knightPath,
      cancelMove,
      commitPromotion,
    };
  },
};
</script>

<style scoped>
#root {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  position: absolute;
  left: 0;
  top: 0;
}

#content {
  position: relative;
  width: 70%;
  height: 70%;
  left: 15%;
  top: 15%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: white;
  color: black;
  font-weight: 700;
  font-family: sans-serif;
}

#buttons_zone {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
}

.single-button {
  border: 1px solid black;
  margin: 5px;
}

ion-img {
  border: 1px solid black;
}
</style>