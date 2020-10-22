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

      <div
        class="game_zone"
        :style="[{ width: sizePx, height: sizePx }, gameZoneStyle]"
      >
        <div class="chessboard" :style="chessboardStyle">
          <ChessBoard :sizePx="size" />
        </div>
        <div class="meta" :style="metaStyle"></div>
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
import { ref, reactive, computed, onBeforeUnmount } from "vue";
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

    function computeLayout() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      const oneDimension = "100%";
      const twoDimensions = "85% 10%";

      if (isPortrait) {
        return [oneDimension, twoDimensions];
      }
      else {
        return [twoDimensions, oneDimension];
      }
    }

    const size = ref(computeSize());
    const gameZoneStyle = reactive({
      margin: "0 auto",
      display: "grid",
      width: "100%",
      height: "100%",
      "grid-template-columns": "100%",
      "grid-template-rows": "85% 10%",
      "flex-direction": "column",
      "justify-content": "center",
      "align-items": "center",
    });

    const chessboardStyle = reactive({
      margin: "auto",
    });
    const metaStyle = reactive({
      width: "100%",
      height: "100%",
      "justify-self": "center",
      "align-self": "center",
      margin: "0.1em",
      "background-color": "salmon",
    });

    const sizePx = computed(function () {
      return size.value + "px";
    });

    function updateSizeAndLayoutOnRotation() {
      size.value = computeSize();
      const [columnsLayout, rowsLayout] = computeLayout();
      gameZoneStyle["grid-template-columns"] = columnsLayout;
      gameZoneStyle["grid-template-rows"] = rowsLayout;
    }

    window.addEventListener("orientationchange", updateSizeAndLayoutOnRotation);

    onBeforeUnmount(function () {
      window.removeEventListener(
        "orientationchange",
        updateSizeAndLayoutOnRotation
      );
    });

    return { size, sizePx, gameZoneStyle, chessboardStyle, metaStyle };
  },
};
</script>