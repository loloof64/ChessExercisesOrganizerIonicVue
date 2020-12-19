<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <ion-icon :icon="arrowBackOutline" @click="navigateBack" />
          {{ getTranslation("game_page.title") }}</ion-title
        >
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" :scrollY="false">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{
            getTranslation("game_page.title")
          }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="game_zone" :style="gameZoneStyle" slot="fixed">
        <chess-board
          :sizePx="boardAndHistorySize"
          :reversed="boardReversed"
          ref="boardComponent"
          @win="handleWin"
          @stalemate="handleStalemate"
          @three-fold-repetition="handleThreeFoldRepetition"
          @insufficient-material="handleInsufficientMaterial"
          @fifty-moves="handleFiftyMoves"
          @move-done="handleMoveDone"
          @external-turn="handleExternalTurn"
        />
        <simple-history
          :sizePx="boardAndHistorySize"
          :navigationBarVisible="historyNavigationBarVisible"
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
          <ion-icon
            :icon="saveOutline"
            :style="metaButtonStyle"
            @click="saveGameInPgn"
          />
        </div>
      </div>

      <ion-spinner
        class="engine_move_spinner"
        color="tertiary"
        v-if="waitingEngineMove"
        :style="waitingSpinnerStyle"
      ></ion-spinner>
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
  IonSpinner,
  toastController,
  alertController,
} from "@ionic/vue";
import {
  swapVertical,
  gameControllerOutline,
  stopCircleOutline,
  saveOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { ref, reactive, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import ChessBoard from "@/components/ChessBoard";
import SimpleHistory from "@/components/SimpleHistory";
import ChessEngineCommunication from "../services/ChessEngineCommunication";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";
import {
  Plugins,
  FilesystemDirectory,
  FilesystemEncoding,
} from "@capacitor/core";
import moment from "moment";

const { Filesystem } = Plugins;

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
    IonSpinner,
  },
  setup() {
    const locale = ref(null);

    const { t } = useI18n();

    const route = useRoute();
    const router = useRouter();

    const { PLAYER_TYPE_HUMAN, PLAYER_TYPE_EXTERNAL } = useChessBoardLogic();

    if (window.Intl && typeof window.Intl === "object") {
      locale.value = navigator.language.substring(0, 2);
    }

    const boardComponent = ref(null);
    const boardReversed = ref(false);
    const historyComponent = ref(null);
    const historyNavigationBarVisible = ref(false);
    const engineCommunication = ref({});
    const engineReady = ref(false);
    const pendingPositionToSendToEngine = ref(null);

    const waitingSpinnerStyle = reactive({
      transform: "scale(3)",
      position: "absolute",
      top: 30,
      left: 30,
      "z-index": 1,
    });

    let engineReadyTimer;

    try {
      const engineCommunicationLayer = new ChessEngineCommunication(
        processEngineMessage
      );
      engineCommunication.value = engineCommunicationLayer;
    } catch (engineLoadingError) {
      engineCommunication.value = null;
      console.error(engineLoadingError);
      showMessageDialog({
        title: getTranslation("game_page.failed_loading_stockfish_title"),
        message: engineLoadingError,
      });
    }

    function navigateBack() {
      if (boardComponent.value.gameIsIdle()) {
        doNavigateBack();
      } else {
        showConfirmDialog({
          title: getTranslation("game_page.confirm_exit_page_title"),
          message: getTranslation("game_page.confirm_exit_page_message"),
          onConfirm: doNavigateBack,
        });
      }
    }

    function doNavigateBack() {
      router.go(-1);
    }

    function sendCommandToEngine(cmd) {
      if (engineCommunication.value) {
        engineCommunication.value.sendCommand(cmd);
      }
    }

    function checkEngineReady() {
      const ENGINE_SEARCH_DEPTH = 13;
      if (engineReady.value === true) {
        clearInterval(engineReadyTimer);
        sendCommandToEngine(
          `position fen ${pendingPositionToSendToEngine.value}`
        );
        pendingPositionToSendToEngine.value = null;
        sendCommandToEngine(`go depth ${ENGINE_SEARCH_DEPTH}`);
      }
    }

    function handleExternalTurn(currentPositionFen) {
      const CHECK_ENGINE_READY_INTERVAL_MS = 100;
      engineReady.value = false;
      pendingPositionToSendToEngine.value = currentPositionFen;
      sendCommandToEngine("isready");

      engineReadyTimer = setInterval(
        checkEngineReady,
        CHECK_ENGINE_READY_INTERVAL_MS
      );
    }

    function processEngineMessage(message) {
      if (message === "readyok") {
        engineReady.value = true;
      } else if (message.startsWith("bestmove")) {
        const moveParams = parseEngineMoveMessage(message);
        if (moveParams) {
          const {
            startFile,
            startRank,
            endFile,
            endRank,
            promotion,
          } = moveParams;

          const moveValidated = boardComponent.value.tryToMakeExternalMove({
            startFile,
            startRank,
            endFile,
            endRank,
            promotion,
          });

          if (moveValidated) {
            boardComponent.value.setLastMoveArrow({
              startFile,
              startRank,
              endFile,
              endRank,
            });
          }
        } else {
          console.error("Bad move parameters got from engine !");
        }
      }
    }

    function parseFile(str) {
      return str.charCodeAt(0) - "a".charCodeAt(0);
    }

    function parseRank(str) {
      return str.charCodeAt(0) - "1".charCodeAt(0);
    }

    function parseEngineMoveMessage(moveStr) {
      const match = moveStr.match(
        /^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/
      );
      if (match) {
        const from = match[1];
        const to = match[2];
        const promotion = match[3];

        const startFile = parseFile(from.charAt(0));
        const startRank = parseRank(from.charAt(1));

        const endFile = parseFile(to.charAt(0));
        const endRank = parseRank(to.charAt(1));

        return { startFile, startRank, endFile, endRank, promotion };
      } else return null;
    }

    function getTranslation(key) {
      return t(key, {}, { locale: locale.value });
    }

    async function showMessageDialog({ title, message }) {
      const alert = await alertController.create({
        cssClass: "confirmDialog",
        header: title,
        message: message,
        buttons: [
          {
            text: getTranslation("general.ok_button"),
            role: "primary",
            cssClass: "primaryButton",
            handler: () => {},
          },
        ],
      });
      alert.present();
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
          onConfirm:  doStartNewGame,
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
            historyNavigationBarVisible.value = true;
          },
        });
      }
    }

    async function doStartNewGame() {
      const defaultPosition =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const gameData = JSON.parse(route.params.gameData);
      const gameCustomPosition = gameData.tags["FEN"] || defaultPosition;
      const startPosition =
        gameCustomPosition !== undefined ? gameCustomPosition : defaultPosition;
      const whiteType = PLAYER_TYPE_HUMAN;
      const blackType = PLAYER_TYPE_EXTERNAL;
      historyNavigationBarVisible.value = false;
      historyComponent.value.startNewGame(startPosition);
      boardComponent.value.letUserStartANewGame(
        startPosition,
        whiteType,
        blackType
      );
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
      historyNavigationBarVisible.value = true;
      showToast(
        whiteSide
          ? getTranslation("game.white_win")
          : getTranslation("game.black_win")
      );
    }

    function handleStalemate() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      historyNavigationBarVisible.value = true;
      showToast(getTranslation("game.stalemate"));
    }

    function handleThreeFoldRepetition() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      historyNavigationBarVisible.value = true;
      showToast(getTranslation("game.draw_three_fold"));
    }

    function handleInsufficientMaterial() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      historyNavigationBarVisible.value = true;
      showToast(getTranslation("game.draw_missing_material"));
    }

    function handleFiftyMoves() {
      historyComponent.value.selectLastHistoryMoveIfThereIsOne();
      historyNavigationBarVisible.value = true;
      showToast(getTranslation("game.draw_fifty_moves"));
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
          boardComponent.value.setLastMoveArrow({
            startFile: lastMoveArrow.fromFile,
            startRank: lastMoveArrow.fromRank,
            endFile: lastMoveArrow.toFile,
            endRank: lastMoveArrow.toRank,
          });
        } else {
          const eraseCoordinate = -100;
          boardComponent.value.setLastMoveArrow({
            startFile: eraseCoordinate,
            startRank: eraseCoordinate,
            endFile: eraseCoordinate,
            endRank: eraseCoordinate,
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

      return isPortrait
        ? {
            width: "100%",
            height: "8%",
          }
        : {
            width: "8%",
            height: "100%",
          };
    }

    function computeMetaButtonDimension() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");

      const width = isPortrait ? "10%" : "60%";
      const height = isPortrait ? "66%" : "10%";
      const margin = isPortrait ? "2% 2%" : "8% 18%";

      return { width, height, margin };
    }

    async function saveGameInPgn() {
      const gamePgn = boardComponent.value.tryToGetGamePgn();
      if (!gamePgn) return;

      try {
        const fileDateStr = moment().format("YYYY_MM_DD_HH_mm_ss");
        const filePath =
          "chess_exercises_organizer/pgn_" + fileDateStr + ".pgn";
        await Filesystem.writeFile({
          path: filePath,
          data: gamePgn,
          directory: FilesystemDirectory.Documents,
          encoding: FilesystemEncoding.ASCII,
          recursive: true,
        });
        showMessageDialog({
          title: getTranslation("game_page.pgn_saved_title"),
          message: t(
            "game_page.pgn_saved_message",
            { filePath: filePath },
            { locale: locale.value }
          ),
        });
      } catch (loadingError) {
        console.error(loadingError);
        showMessageDialog({
          title: getTranslation("game_page.error_saving_pgn_title"),
          message: loadingError,
        });
      }
    }

    function updateSizeAndLayout() {
      boardAndHistorySize.value = computeBoardAndHistorySize();
      const [columnsLayout, rowsLayout] = computeLayout();

      const {
        width: metaZoneWidth,
        height: metaZoneHeight,
      } = computeMetaZoneDimensions();

      const {
        width: buttonWidth,
        height: buttonHeight,
        margin: buttonMargin,
      } = computeMetaButtonDimension();

      gameZoneStyle["flex-direction"] = computeGameZoneDirection();
      gameZoneStyle["grid-template-columns"] = columnsLayout;
      gameZoneStyle["grid-template-rows"] = rowsLayout;

      metaStyle["flex-direction"] = computeMetaZoneDirection();
      metaStyle["width"] = metaZoneWidth;
      metaStyle["height"] = metaZoneHeight;

      metaButtonStyle["width"] = buttonWidth;
      metaButtonStyle["height"] = buttonHeight;
      metaButtonStyle["margin"] = buttonMargin;

      const cellsSize = boardAndHistorySize.value * 0.1111;
      waitingSpinnerStyle["transform"] = `scale(${0.25 * cellsSize})`;
      waitingSpinnerStyle["left"] = `${7 * cellsSize}px`;
      waitingSpinnerStyle["top"] = `${7 * cellsSize}px`;
    }

    const waitingEngineMove = computed(() => {
      if (!boardComponent.value) return false;
      return boardComponent.value.externalTurn();
    });

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
      saveOutline,
      arrowBackOutline,
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
      handleExternalTurn,
      historyNavigationBarVisible,
      waitingEngineMove,
      waitingSpinnerStyle,
      saveGameInPgn,
      getTranslation,
      navigateBack,
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

.confirmDialog .alert-wrapper .alert-message {
  color: blue;
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