<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Game</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" :scrollY="false">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Game</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="game_zone" :style="gameZoneStyle">
          <ChessBoard
            :sizePx="boardAndHistorySize"
            :reversed="boardReversed"
            ref="boardComponent"
            @win="handleWin"
            @stalemate="handleStalemate"
            @three-fold-repetition="handleThreeFoldRepetition"
            @insufficient-material="handleInsufficientMaterial"
            @fifty-moves="handleFiftyMoves"
            @move-done="handleMoveDone"
          />
          <simple-history
            :sizePx="boardAndHistorySize"
            ref="historyComponent"
            @selection-request="handleHistorySelectionRequest"
          />
        <div :style="metaStyle">
          <ion-icon
            :icon="swapVertical"
            :style="metaButtonStyle"
            @click="boardReversed = !boardReversed"
          />
          <ion-icon
            :icon="gameControllerOutline"
            :style="metaButtonStyle"
            @click="startNewGame"
          />
          <ion-icon
            :icon="stopCircleOutline"
            :style="metaButtonStyle"
            @click="stopGame"
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
  toastController,
  alertController,
} from "@ionic/vue";
import {
  swapVertical,
  gameControllerOutline,
  stopCircleOutline,
} from "ionicons/icons";
import { ref, reactive, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import ChessBoard from "@/components/ChessBoard";
import SimpleHistory from "@/components/SimpleHistory";

export default {
  name: "Game",
  components: {
    ChessBoard,
    SimpleHistory,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    IonIcon,
  },
  setup() {
    const locale = ref(null);

    const { t } = useI18n();

    if (window.Intl && typeof window.Intl === "object") {
      locale.value = navigator.language.substring(0, 2);
    }

    const boardComponent = ref(null);

    const boardReversed = ref(false);

    const historyComponent = ref(null);

    function getTranslation(key) {
      return t(key, {}, { locale: locale.value });
    }

    async function showConfirmDialog({ title, message, onCancel, onConfirm }) {
      const alert = await alertController.create({
        cssClass: "confirmDialog",
        header: title,
        message: message,
        buttons: [
          {
            text: getTranslation("general.cancel_button"),
            role: "cancel",
            cssClass: "secondaryButton",
            handler: () => {
              if (onCancel) onCancel();
            },
          },
          {
            text: getTranslation("general.ok_button"),
            role: "primary",
            cssClass: "primaryButton",
            handler: () => {
              if (onConfirm) onConfirm();
            },
          },
        ],
      });
      alert.present();
    }

    function startNewGame() {
      if (boardComponent.value.gameIsIdle()) {
        doStartNewGame();
      } else {
        showConfirmDialog({
          title: getTranslation("game_page.confirm_restart_title"),
          message: getTranslation("game_page.confirm_restart_message"),
          onConfirm: () => doStartNewGame(),
        });
      }
    }

    function stopGame() {
      if (boardComponent.value.gameIsInProgress()) {
        showConfirmDialog({
          title: getTranslation("game_page.confirm_stop_title"),
          message: getTranslation("game_page.confirm_stop_message"),
          onConfirm: () => {
            boardComponent.value.stopCurrentGame();
            historyComponent.value.selectLastHistoryMoveIfThereIsOne();
          },
        });
      }
    }

    function doStartNewGame() {
      historyComponent.value.startNewGame();
      boardComponent.value.letUserStartANewGame();
    }

    function computeBoardAndHistorySize() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const sizeRatio = isPortrait ? 0.55 : 0.62;
      return Math.floor(sizeRatio * minSize);
    }

    function computeLayout() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      const oneDimension = "100%";
      const threeDimensions = "42%  42% 10%";

      if (isPortrait) {
        return [oneDimension, threeDimensions];
      } else {
        return [threeDimensions, oneDimension];
      }
    }

    const boardAndHistorySize = ref(computeBoardAndHistorySize());
    const gameZoneStyle = reactive({
      margin: "0 auto",
      display: "flex",
      width: "100%",
      height: "100%",
      "flex-direction": "column",
      "justify-content": "space-between",
      "align-items": "center",
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
      margin: "1.5% 0.5%",
      border: "1px solid black",
    });

    async function showToast(message, duration = 1100) {
      const toast = await toastController.create({
        message,
        duration: duration,
      });
      return toast.present();
    }

    function handleWin(whiteSide) {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      showToast(
        whiteSide
          ? t("game.white_win", {}, { locale: locale.value })
          : t("game.black_win", {}, { locale: locale.value })
      );
    }

    function handleStalemate() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      showToast(t("game.stalemate", {}, { locale: locale.value }));
    }

    function handleThreeFoldRepetition() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      showToast(t("game.draw_three_fold", {}, { locale: locale.value }));
    }

    function handleInsufficientMaterial() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      showToast(t("game.draw_missing_material", {}, { locale: locale.value }));
    }

    function handleFiftyMoves() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      showToast(t("game.draw_fifty_moves", {}, { locale: locale.value }));
    }

    function handleMoveDone(moveData) {
      historyComponent.value.addMove({ ...moveData });
    }

    function handleHistorySelectionRequest(data) {
      const success = boardComponent.value.tryToLoadPosition(data.fen);
      if (success) {
        historyComponent.value.commitSelection(data.index);
        const lastMoveArrow = historyComponent.value.getSelectedMoveArrow();
        if (lastMoveArrow !== undefined) {
          boardComponent.value.tryToSetLastMoveArrow({
            startFile: lastMoveArrow.fromFile,
            startRank: lastMoveArrow.fromRank,
            endFile: lastMoveArrow.toFile,
            endRank: lastMoveArrow.toRank
          });
        }
      }
    }

    function computeGameZoneDirection() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      return isPortrait ? "column" : "row";
    }

    function computeMetaZoneDirection() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      return isPortrait ? "row" : "column";
    }

    function computeMetaZoneDimensions() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      return isPortrait ? {
        width: "100%",
        height: "8%",
      } : {
        width: "8%",
        height: "100%"
      }
    }

    function computeMetaButtonDimension() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      const width = isPortrait ? "10%" : "60%";
      const height = isPortrait ? "66%" : "10%";
      const margin = isPortrait ? "2% 2%" : "8% 18%";

      return { width, height, margin };
    }

    function updateSizeAndLayout() {
      boardAndHistorySize.value = computeBoardAndHistorySize();
      const [columnsLayout, rowsLayout] = computeLayout();

      const {width: metaZoneWidth, height: metaZoneHeight} = computeMetaZoneDimensions();

      const {
        width: buttonWidth,
        height: buttonHeight,
        margin: buttonMargin,
      } = computeMetaButtonDimension();

      gameZoneStyle ["flex-direction"] = computeGameZoneDirection();
      gameZoneStyle["grid-template-columns"] = columnsLayout;
      gameZoneStyle["grid-template-rows"] = rowsLayout;

      metaStyle["flex-direction"] = computeMetaZoneDirection();
      metaStyle["width"] = metaZoneWidth;
      metaStyle ["height"] = metaZoneHeight;

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
      boardAndHistorySize,
      gameZoneStyle,
      metaStyle,
      metaButtonStyle,
      swapVertical,
      gameControllerOutline,
      stopCircleOutline,
      boardReversed,
      boardComponent,
      historyComponent,
      startNewGame,
      stopGame,
      handleWin,
      handleStalemate,
      handleThreeFoldRepetition,
      handleInsufficientMaterial,
      handleFiftyMoves,
      handleMoveDone,
      handleHistorySelectionRequest,
    };
  },
};
</script>

<style>
.game_zone {
  width: 100%;
  height: 100%;
}

.confirmDialog .alert-wrapper {
  background-color: rgba(45, 211, 211, 0.6);
}

.confirmDialog .primaryButton.alert-button {
  background-color: green;
  color: white;
  border-radius: 20%;
}

.confirmDialog .secondaryButton.alert-button {
  background-color: red;
  color: white;
  border-radius: 20%;
}
</style>