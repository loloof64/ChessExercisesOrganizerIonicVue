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
          <ChessBoard :sizePx="size" :reversed="boardReversed" />
        </div>
        <div :style="metaStyle">
          <ion-icon
            :icon="swapVertical"
            :style="metaButtonStyle"
            @click="boardReversed = !boardReversed"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
} from "@ionic/vue";
import { swapVertical } from "ionicons/icons";
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
    IonIcon,
  },
  setup() {
    const boardReversed = ref(false);

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
      } else {
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

    const metaButtonStyle = reactive({
      color: "blue",
      width: "10%",
      height: "66%",
      margin: "1.5% 5%",
      border: "1px solid black",
    });

    const sizePx = computed(function () {
      return size.value + "px";
    });

    function computeMetaZoneDirection() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      return isPortrait ? "row" : "column";
    }

    function computeMetaButtonDimension() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      const width = isPortrait ? "10%" : "60%";
      const height = isPortrait ? "66%" : "15%";
      const margin = isPortrait ? "2% 5%" : "15% 18%";

      return { width, height, margin };
    }

    function updateSizeAndLayout() {
      size.value = computeSize();
      const [columnsLayout, rowsLayout] = computeLayout();
      const {
        width: buttonWidth,
        height: buttonHeight,
        margin: buttonMargin,
      } = computeMetaButtonDimension();

      gameZoneStyle["grid-template-columns"] = columnsLayout;
      gameZoneStyle["grid-template-rows"] = rowsLayout;

      metaStyle["flex-direction"] = computeMetaZoneDirection();

      metaButtonStyle["width"] = buttonWidth;
      metaButtonStyle["height"] = buttonHeight;
      metaButtonStyle["margin"] = buttonMargin;
    }

    window.addEventListener("orientationchange", updateSizeAndLayout);

    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", updateSizeAndLayout);
    });

    updateSizeAndLayout();

    return {
      size,
      sizePx,
      gameZoneStyle,
      chessboardStyle,
      metaStyle,
      metaButtonStyle,
      swapVertical,
      boardReversed,
    };
  },
};
</script>