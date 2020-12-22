<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ getTranslation("sample_games_tab.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{
            getTranslation("sample_games_tab.title")
          }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div
        class="item"
        v-for="aGame in games"
        :key="aGame.nameKey"
        @click="loadGame(aGame.fileName, aGame.nameKey)"
      >
        {{ getTranslation(completeNameKey(aGame.nameKey)) }}
      </div>

      <pgn-game-selector
        ref="gameSelector"
        :pgnGames="pgnGamesToPreview"
        :title="pgnGameSelectorTitle"
        @game-selected="launchGame"
      />
    </ion-content>
  </ion-page>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";
import PgnParser from "pgn-parser";
import convertPgnDataToHistory from "@/services/PgnGameDataToHistoryData";
import PgnGameSelector from "@/components/PgnGameSelector";

export default {
  name: "SampleGames",
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
    PgnGameSelector,
  },
  setup() {
    const locale = ref(null);
    const { t } = useI18n();

    const router = useRouter();

    function getTranslation(key) {
      return t(key, {}, { locale: locale.value });
    }

    if (window.Intl && typeof window.Intl === "object") {
      locale.value = navigator.language.substring(0, 2);
    }

    const gameSelector = ref(null);
    const pgnGamesToPreview = ref(null);
    const pgnGameSelectorTitle = ref(null);

    function completeNameKey(gameNameKey) {
      return `sample_games_tab.${gameNameKey}`;
    }

    async function loadGame(fileName, nameTranslationKey) {
      const filePath = `/assets/sample-pgn-files/${fileName}.pgn`;
      try {
        const file = await fetch(filePath);
        const text = await file.text();

        const pgnGames = PgnParser.parse(text);
        pgnGamesToPreview.value = pgnGames;
        pgnGameSelectorTitle.value = getTranslation(
          `sample_games_tab.${nameTranslationKey}`
        );

        gameSelector.value?.open();
      } catch (err) {
        console.error(err);
        gameSelector.value?.dismiss();
      }
    }

    async function launchGame({
      index: selectedGameIndex,
      whiteSide,
      blackSide,
    }) {
      gameSelector.value?.dismiss();
      try {
        const gameData = pgnGamesToPreview.value[selectedGameIndex];
        const solutionData = convertPgnDataToHistory(gameData);

        const gameDataJSON = JSON.stringify(gameData);
        const solutionDataJSON = JSON.stringify(solutionData);
        await router.push({
          name: "game",
          params: {
            gameData: gameDataJSON,
            solutionData: solutionDataJSON,
            whiteSide,
            blackSide,
          },
        });
      } catch (err) {
        console.error(err);
      }
    }

    const games = [
      {
        fileName: "QKvK",
        nameKey: "queen_king_vs_king",
      },
      {
        fileName: "RRKvK",
        nameKey: "2rooks_king_vs_king",
      },
      {
        fileName: "RKvK",
        nameKey: "rook_king_vs_king",
      },
      {
        fileName: "BBKvK",
        nameKey: "2bishops_king_vs_king",
      },
      {
        fileName: "PawnEndgames",
        nameKey: "pawn_endgames",
      },
    ];

    return {
      getTranslation,
      games,
      completeNameKey,
      loadGame,
      pgnGamesToPreview,
      pgnGameSelectorTitle,
      gameSelector,
      launchGame,
    };
  },
};
</script>

<style>
.item {
  font-size: 1.5em;
  border-bottom: 1px solid black;
}
</style>