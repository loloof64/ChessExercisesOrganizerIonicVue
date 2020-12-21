<template>
  <div class="dropShadow" v-if="active">
    <div class="title">{{ title }}</div>
    <chess-board :sizePx="boardSize" ref="boardComponent" />
    <div class="buttonsZone">
      <div class="button ok" @click="emitSelectedIndex">{{ getTranslation("general.ok_button") }}</div>
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

    const { PLAYER_TYPE_EXTERNAL } = useChessBoardLogic();

    const boardSize = ref(null);
    const active = ref(false);
    let gameIndex = -1;
    const boardComponent = ref(null);

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
        selectedGame?.headers?.find((item) => item.name === "FEN").value ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      boardComponent.value?.letUserStartANewGame(
        startPosition,
        PLAYER_TYPE_EXTERNAL,
        PLAYER_TYPE_EXTERNAL
      );
    }

    function open() {
      active.value = true;
      gameIndex = 0;
      setTimeout(() => {
        // The board component won't be available until some times, because its must be visible
        // which occurs just after the active state is taken into account.
        updateSelectedGame();
      }, 150);
    }

    function dismiss() {
      active.value = false;
    }

    function emitSelectedIndex() {
        context.emit('game-selected', gameIndex);
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
  font-size: 1.2em;
  margin-bottom: 2%;
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
  margin: 4%;
}

.ok {
  background-color: green;
}

.cancel {
  background-color: red;
}
</style>