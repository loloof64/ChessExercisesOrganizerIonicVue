<template>
  <div class="dropShadow" v-if="active">
    <div class="mainZone" :style="mainZoneStyle">
      <div class="header">
        <div class="title">{{ title }}</div>
        <div class="goal">{{ goalText }}</div>
        <div class="navigation">
          <ion-icon
            :icon="playSkipBackCircleOutline"
            class="navigationButton"
            @click="chooseFirstGame"
          />
          <ion-icon
            :icon="playBackCircleOutline"
            class="navigationButton"
            @click="choosePreviousGame"
          />
          <span class="navigationText"
            >{{ currentGameNumber }} / {{ totalGamesCount }}</span
          >
          <ion-icon
            :icon="playForwardCircleOutline"
            class="navigationButton"
            @click="chooseNextGame"
          />
          <ion-icon
            :icon="playSkipForwardCircleOutline"
            class="navigationButton"
            @click="chooseLastGame"
          />
        </div>
      </div>
      <chess-board :sizePx="boardSize" ref="boardComponent" />
      <div class="footer">
        <div class="playersType">
          <div class="playersTypeLine">
            <span class="label">{{
              getTranslation("game_selector.whites")
            }}</span>
            <select
              ref="whiteSideTypeSelect"
              @change="handleWhiteSideTypeChange"
            >
              <option value="human">
                {{ getTranslation("game_selector.human") }}
              </option>
              <option value="external">
                {{ getTranslation("game_selector.cpu") }}
              </option>
            </select>
          </div>
          <div class="playersTypeLine">
            <span class="label">{{
              getTranslation("game_selector.blacks")
            }}</span>
            <select
              ref="blackSideTypeSelect"
              @change="handleBlackSideTypeChange"
            >
              <option value="human">
                {{ getTranslation("game_selector.human") }}
              </option>
              <option value="external">
                {{ getTranslation("game_selector.cpu") }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="buttonsZone">
      <div class="button ok" @click="emitSelectedIndex">
        {{ getTranslation("general.ok_button") }}
      </div>
      <div class="button cancel" @click="dismiss">
        {{ getTranslation("general.cancel_button") }}
      </div>
    </div>
  </div>
</template>

<script>
import ChessBoard from "@/components/ChessBoard";
import { ref, reactive, onBeforeUnmount, computed } from "vue";
import { IonIcon } from "@ionic/vue";
import { useI18n } from "vue-i18n";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";
import usePgnUtils from "@/hooks/PgnUtils";

import {
  playBackCircleOutline,
  playSkipBackCircleOutline,
  playForwardCircleOutline,
  playSkipForwardCircleOutline,
} from "ionicons/icons";

export default {
  props: {
    pgnGames: {
      type: Object,
      default: () => {
        return {};
      },
    },
    title: {
      type: String,
      default: "",
    },
  },
  components: {
    ChessBoard,
    IonIcon,
  },
  setup(props, context) {
    const locale = ref(null);
    const { t } = useI18n();
    if (window.Intl && typeof window.Intl === "object") {
      locale.value = navigator.language.substring(0, 2);
    }

    function getTranslation(key) {
      return t(key, {}, { locale: locale.value });
    }

    const { PLAYER_TYPE_HUMAN, PLAYER_TYPE_EXTERNAL } = useChessBoardLogic();
    const { getSelectedGameGoal } = usePgnUtils();

    const boardSize = ref(null);
    const active = ref(false);
    const gameIndex = ref(-1);
    const boardComponent = ref(null);
    const whiteSideTypeSelect = ref(null);
    const blackSideTypeSelect = ref(null);
    const goalText = ref("");

    const mainZoneStyle = reactive({
      "flex-direction": "column",
    });

    const whiteSideType = ref(PLAYER_TYPE_HUMAN);
    const blackSideType = ref(PLAYER_TYPE_HUMAN);

    function computeBoardSize() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const sizeRatio = isPortrait ? 0.55 : 0.45;
      boardSize.value = Math.floor(sizeRatio * minSize);
    }

    function updateSelectedGame() {
      if (gameIndex.value < 0) {
        boardComponent.value?.letUserStartANewGame(
          "8/8/8/8/8/8/8/8 w - - 0 1",
          PLAYER_TYPE_EXTERNAL,
          PLAYER_TYPE_EXTERNAL
        );
        return;
      }
      const selectedGame = props.pgnGames?.[gameIndex.value];
      if (!selectedGame) return;

      const startPosition =
        selectedGame?.headers?.find((item) => item.name === "FEN")?.value ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      boardComponent.value?.letUserStartANewGame(
        startPosition,
        PLAYER_TYPE_EXTERNAL,
        PLAYER_TYPE_EXTERNAL
      );

      const startsWithWhiteTurn = startPosition.split(" ")[1] === "w";
      if (startsWithWhiteTurn) {
        whiteSideTypeSelect.value.value = "human";
        blackSideTypeSelect.value.value = "external";
        whiteSideType.value = PLAYER_TYPE_HUMAN;
        blackSideType.value = PLAYER_TYPE_EXTERNAL;
      } else {
        whiteSideTypeSelect.value.value = "external";
        blackSideTypeSelect.value.value = "human";
        whiteSideType.value = PLAYER_TYPE_EXTERNAL;
        blackSideType.value = PLAYER_TYPE_HUMAN;
      }

      goalText.value = getSelectedGameGoal(selectedGame, locale.value);
    }

    function open() {
      active.value = true;
      gameIndex.value = 0;
      setTimeout(() => {
        // The board component won't be available until some times, because its must be visible
        // which occurs just after the active state is taken into account.
        updateSelectedGame();
      }, 100);
    }

    function dismiss() {
      active.value = false;
    }

    function emitSelectedIndex() {
      context.emit("game-selected", {
        index: gameIndex.value,
        whiteSide: whiteSideType.value,
        blackSide: blackSideType.value,
      });
    }

    function handleWhiteSideTypeChange() {
      const newValue = whiteSideTypeSelect.value?.value || "human";
      whiteSideType.value =
        newValue === "human" ? PLAYER_TYPE_HUMAN : PLAYER_TYPE_EXTERNAL;
    }

    function handleBlackSideTypeChange() {
      const newValue = blackSideTypeSelect.value?.value || "human";
      blackSideType.value =
        newValue === "human" ? PLAYER_TYPE_HUMAN : PLAYER_TYPE_EXTERNAL;
    }

    function computeAlignment() {
      const orientationType = ScreenOrientation.type;
      const isPortrait = orientationType.includes("portrait");
      mainZoneStyle["flex-direction"] = isPortrait ? "column" : "row";
    }

    function chooseFirstGame() {
      gameIndex.value = 0;
      updateSelectedGame();
    }

    function choosePreviousGame() {
      if (gameIndex.value > 0) gameIndex.value -= 1;
      updateSelectedGame();
    }

    function chooseNextGame() {
      if (gameIndex.value < totalGamesCount.value - 1) gameIndex.value += 1;
      updateSelectedGame();
    }

    function chooseLastGame() {
      gameIndex.value = totalGamesCount.value - 1;
      updateSelectedGame();
    }

    const totalGamesCount = computed(() => {
      if (!props.pgnGames) return 0;
      return props.pgnGames.length;
    });

    const currentGameNumber = computed(() => {
      return gameIndex.value + 1;
    });

    window.addEventListener("orientationchange", computeBoardSize);
    window.addEventListener("orientationchange", computeAlignment);

    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", computeBoardSize);
      window.removeEventListener("orientationchange", computeAlignment);
    });

    computeBoardSize();
    updateSelectedGame();

    return {
      boardSize,
      active,
      open,
      dismiss,
      getTranslation,
      boardComponent,
      emitSelectedIndex,
      whiteSideTypeSelect,
      blackSideTypeSelect,
      handleWhiteSideTypeChange,
      handleBlackSideTypeChange,
      goalText,
      mainZoneStyle,
      playBackCircleOutline,
      playSkipBackCircleOutline,
      playForwardCircleOutline,
      playSkipForwardCircleOutline,
      currentGameNumber,
      totalGamesCount,
      chooseFirstGame,
      choosePreviousGame,
      chooseNextGame,
      chooseLastGame,
    };
  },
};
</script>

<style scoped>
.dropShadow {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background-color: rgba(209, 202, 221, 0.562);

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.mainZone {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
}

.header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.footer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.title {
  color: blue;
  font-family: sans-serif;
  font-size: 1em;
  margin-bottom: 0.5%;
}

.goal {
  color: green;
  font-family: serif;
  font-size: 1em;
  margin-bottom: 0.5%;
}

.navigation {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.playersType {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0.5% 0;
}

.playersTypeLine {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin: 0.5% 0;
}

.playersType > .playersTypeLine > .label {
  padding: 0 2%;
}

.buttonsZone {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  align-self: flex-end;
  padding-right: 1%;
}

.button {
  color: white;
  font-family: sans-serif;
  font-size: 1.04em;
  border-radius: 18%;
  padding: 8%;
  margin: 0.5% 4%;
}

.navigationButton {
  color: green;
  font-size: 1.04em;
}

.navigationText {
  color: green;
  font-size: 1.04em;
}

.ok {
  background-color: green;
}

.cancel {
  background-color: red;
}
</style>