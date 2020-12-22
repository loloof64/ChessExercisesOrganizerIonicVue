<template>
  <div class="dropShadow" v-if="active">
    <div class="title">{{ title }}</div>
    <div class="goal">{{ goalText }}</div>
    <chess-board :sizePx="boardSize" ref="boardComponent" />
    <div class="playersType">
      <div class="playersTypeLine">
        <span class="label">{{ getTranslation("game_selector.whites") }}</span>
        <select ref="whiteSideTypeSelect" @change="handleWhiteSideTypeChange">
          <option value="human">
            {{ getTranslation("game_selector.human") }}
          </option>
          <option value="external">
            {{ getTranslation("game_selector.cpu") }}
          </option>
        </select>
      </div>
      <div class="playersTypeLine">
        <span class="label">{{ getTranslation("game_selector.blacks") }}</span>
        <select ref="blackSideTypeSelect" @change="handleBlackSideTypeChange">
          <option value="human">
            {{ getTranslation("game_selector.human") }}
          </option>
          <option value="external">
            {{ getTranslation("game_selector.cpu") }}
          </option>
        </select>
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
import { ref, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import useChessBoardLogic from "@/hooks/ChessBoardLogic";

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

    const boardSize = ref(null);
    const active = ref(false);
    let gameIndex = -1;
    const boardComponent = ref(null);
    const whiteSideTypeSelect = ref(null);
    const blackSideTypeSelect = ref(null);
    const goalText = ref("");

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
      if (gameIndex < 0) {
        boardComponent.value?.letUserStartANewGame(
          "8/8/8/8/8/8/8/8 w - - 0 1",
          PLAYER_TYPE_EXTERNAL,
          PLAYER_TYPE_EXTERNAL
        );
        return;
      }
      const selectedGame = props.pgnGames?.[gameIndex];
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

      updateSelectedGameGoal(selectedGame);
    }

    function updateSelectedGameGoal(selectedGame) {
      let newGoalText = "";
      const defaultGoalText = selectedGame?.headers?.find(
        (item) => item.name === "Goal"
      )?.value;

      const englishGoalText = getSelectedGameGoalTranslation(selectedGame, "en");
      const currentLocaleGoalText = getSelectedGameGoalTranslation(selectedGame, locale.value);

      if (currentLocaleGoalText) {
        newGoalText = currentLocaleGoalText;
      }
      else if (englishGoalText) {
        newGoalText = englishGoalText;
      }
      else if (defaultGoalText) {
        newGoalText = defaultGoalText;
      }
      
      goalText.value = newGoalText;
    }

    function getSelectedGameGoalTranslation(selectedGame, localeStr) {
      return selectedGame?.headers?.find(
        (item) => item.name === `Goal_${localeStr}`
      )?.value;
    }

    function open() {
      active.value = true;
      gameIndex = 0;
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
        index: gameIndex,
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

    window.addEventListener("orientationchange", computeBoardSize);

    onBeforeUnmount(function () {
      window.removeEventListener("orientationchange", computeBoardSize);
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
  background-color: rgba(92, 21, 207, 0.562);

  display: flex;
  flex-direction: column; 
  justify-content: center;
  align-items: center;
}

.title {
  color: blue;
  font-family: sans-serif;
  font-size: 1.0em;
  margin-bottom: 0.5%;
}

.goal {
  color: yellow;
  font-family: serif;
  font-size: 1.0em;
  margin-bottom: 0.5%;
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

.ok {
  background-color: green;
}

.cancel {
  background-color: red;
}
</style>