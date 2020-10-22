<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Game</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Game</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="board_zone" :style="{ width: sizePx, height: sizePx }">
        <ChessBoard :sizePx="size" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";
import { ref, computed } from "vue";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import ChessBoard from "@/components/ChessBoard.vue";

export default {
  name: "Game",
  components: {
    ChessBoard,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
  },
  setup() {
    function computeSize() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const sizeRatio = isPortrait ? 0.9 : 0.6;
      return Math.floor(sizeRatio * minSize);
    }

    const size = ref(computeSize());

    const sizePx = computed(function () {
      return size.value + "px";
    });

    const orientationListenerHandle = window.addEventListener(
      "orientationchange",
      function () {
        size.value = computeSize();
      }
    );

    return { size, sizePx };
  },
};
</script>

<style lang="scss" scoped>
.board_zone {
  margin: 0.9em auto;
}
</style>