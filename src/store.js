import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

import useChessBoardLogic from "@/hooks/ChessBoardLogic";
const { PLAYER_TYPE_HUMAN } = useChessBoardLogic();

const gameModule = {
  state() {
    return {
      selectedGamePgn: null,
      solutionPgn: null,
      activeGamePgn: null,
      whiteSide: PLAYER_TYPE_HUMAN,
      blackSide: PLAYER_TYPE_HUMAN,
    };
  },
  mutations: {
    clearPgnData(state) {
      state.selectedGamePgn = null;
      state.solutionPgn = null;
      state.activeGamePgn = null;
    },
    setSelectedGamePgn(state, payload) {
      state.selectedGamePgn = payload.pgnDataObject;
    },
    setSolutionPgn(state, payload) {
      state.solutionPgn = payload.pgnDataObject;
    },
    setActiveGamePgn(state, payload) {
      state.activeGamePgn = payload.pgnDataObject;
    },
    setWhiteSide(state, payload) {
      state.whiteSide = payload.playerType;
    },
    setBlackSide(state, payload) {
      state.blackSide = payload.playerType;
    },
  },
  actions: {
    clearPgnData(context) {
      context.commit('clearPgnData');
    },
    setSelectedGamePgn(context, payload) {
      context.commit('setSelectedGamePgn', payload);
    },
    setSolutionPgn(context, payload) {
      context.commit('setSolutionPgn', payload);
    },
    setActiveGamePgn(context, payload) {
      context.commit('setActiveGamePgn', payload);
    },
    setWhiteSide(context, payload) {
      context.commit('setWhiteSide', payload);
    },
    setBlackSide(context, payload) {
      context.commit('setBlackSide', payload);
    },
  },
  getters: {
    solutionPgn(state) {
      return state.solutionPgn;
    },
    selectedGamePgn(state) {
      return state.selectedGamePgn;
    },
    activeGamePgn(state) {
      return state.activeGamePgn;
    },
    whiteSide(state) {
      return state.whiteSide;
    },
    blackSide(state) {
      return state.blackSide;
    }
  }
};

const store = createStore({
  modules: {
    game: gameModule,
  },
  plugins: [createPersistedState()],
});

export default store;