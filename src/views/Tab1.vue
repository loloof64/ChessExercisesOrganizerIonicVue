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
        @click="loadGame(aGame.fileName)"
      >
        {{ getTranslation(completeNameKey(aGame.nameKey)) }}
      </div>
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
import PgnParser from "@mliebelt/pgn-parser";
import convertPgnDataToHistory from "@/services/PgnGameDataToHistoryData";

export default {
  name: "SampleGames",
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
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

    function completeNameKey(gameNameKey) {
      return `sample_games_tab.${gameNameKey}`;
    }

    async function loadGame(fileName) {
      const filePath = `/assets/sample-pgn-files/${fileName}.pgn`;
      try {
        const file = await fetch(filePath);
        const text = await file.text();

        const pgnGames = PgnParser.parse(text, { startRule: "games" });
        const selectedGameIndex = 0;
        const gameData = pgnGames[selectedGameIndex];
        const solutionData = convertPgnDataToHistory(gameData);
        const gameDataJSON = JSON.stringify(gameData);
        const solutionDataJSON = JSON.stringify(solutionData);
        await router.push({
          name: "game",
          params: { gameData: gameDataJSON, solutionData: solutionDataJSON },
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
      {
        fileName: "BerndRosenExercises",
        nameKey: "BerndRosenExercises",
      },
    ];

    return {
      getTranslation,
      games,
      completeNameKey,
      loadGame,
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