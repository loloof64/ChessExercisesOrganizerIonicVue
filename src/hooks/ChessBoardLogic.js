import Chess from "chess.js";
import { ref, computed } from "vue";
import moment from "moment";

export default function useChessBoardLogic() {
  const GAME_STATUS_IDLE = 0;
  const GAME_STATUS_RUNNING = 1;
  const GAME_STATUS_WHITE_WIN = 2;
  const GAME_STATUS_BLACK_WIN = 4;
  const GAME_STATUS_DRAW_STALEMATE = 8;
  const GAME_STATUS_DRAW_THREE_FOLD_REPETITION = 16;
  const GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL = 32;
  const GAME_STATUS_DRAW_FIFTY_MOVES_RULE = 64;
  const GAME_STATUS_STOPPED = 128;

  const PLAYER_TYPE_NONE = 0;
  const PLAYER_TYPE_HUMAN = 1;
  const PLAYER_TYPE_EXTERNAL = 2;

  const PGN_GAME_IN_PROGRESS_STR = "*";
  const PGN_WHITE_WIN_STR = "1-0";
  const PGN_BLACK_WIN_STR = "0-1";
  const PGN_DRAW_STR = "1/2-1/2";

  const game = ref(new Chess("8/8/8/8/8/8/8/8 w - - 0 1"));
  const positions_occurences = ref({});
  const gameStatus = ref(GAME_STATUS_IDLE);
  const gamePgnText = ref(null);
  const gameCurrentFen = ref(game.value.fen());
  const currentTurnIsWhite = ref(false);

  const whitePlayerType = ref(PLAYER_TYPE_NONE);
  const blackPlayerType = ref(PLAYER_TYPE_NONE);

  function getGameStatus() {
    return gameStatus.value;
  }

  /*
  Be careful : only call this method once after each move done,
  otherwise the positions FEN occurences counter will be messed.
  */
  function updateGameStatusIfFinished() {
    const positionFenWithoutNoise = game.value
      .fen()
      .split(" ")
      .splice(0, 4)
      .join(" ");

    addPositionFenToOccurences(positionFenWithoutNoise);

    const gameInThreeFoldRepetitions =
      positions_occurences.value[positionFenWithoutNoise] >= 3;

    if (game.value.in_checkmate()) {
      fillGamePgn();
      const isWhiteTurn = game.value.turn() === "w";
      gameStatus.value = isWhiteTurn
        ? GAME_STATUS_BLACK_WIN
        : GAME_STATUS_WHITE_WIN;
    } else if (game.value.in_stalemate()) {
      fillGamePgn();
      gameStatus.value = GAME_STATUS_DRAW_STALEMATE;
    } else if (gameInThreeFoldRepetitions) {
      fillGamePgn();
      gameStatus.value = GAME_STATUS_DRAW_THREE_FOLD_REPETITION;
    } else if (game.value.insufficient_material()) {
      fillGamePgn();
      gameStatus.value = GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL;
    } else if (game.value.in_draw()) {
      fillGamePgn();
      gameStatus.value = GAME_STATUS_DRAW_FIFTY_MOVES_RULE;
    }
  }

  function startNewGame(
    startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    whiteType = PLAYER_TYPE_HUMAN,
    blackType = PLAYER_TYPE_HUMAN
  ) {
    positions_occurences.value = {};
    game.value = new Chess(startPosition);
    gameCurrentFen.value = startPosition;
    currentTurnIsWhite.value = game.value.turn() === "w";
    whitePlayerType.value = whiteType;
    blackPlayerType.value = blackType;
    gameStatus.value = GAME_STATUS_RUNNING;
  }

  function stopCurrentGame() {
    gameStatus.value = GAME_STATUS_STOPPED;
    fillGamePgn();
    resetPlayerTypes();
  }

  function resetPlayerTypes() {
    whitePlayerType.value = PLAYER_TYPE_NONE;
    blackPlayerType.value = PLAYER_TYPE_NONE;
  }

  function addPositionFenToOccurences(positionFen) {
    const positionFenWithoutNoise = positionFen
      .split(" ")
      .splice(0, 4)
      .join(" ");

    if (!positions_occurences.value[positionFenWithoutNoise]) {
      positions_occurences.value[positionFenWithoutNoise] = 0;
    }
    positions_occurences.value[positionFenWithoutNoise] += 1;
  }

  function makeExternalMove({
    startFile,
    startRank,
    endFile,
    endRank,
    promotion,
  }) {
    if (!isExternalTurn()) return;
    if (!isLegalMove({ startFile, startRank, endFile, endRank })) return;
    const positionFenBeforeMove = game.value.fen();
    const moveResult = makeMove({
      startFile,
      startRank,
      endFile,
      endRank,
      promotion,
    });
    const notValidated = moveResult === undefined;
    if (notValidated) {
      console.error(
        `Bad external move : ${{
          startFile,
          startRank,
          endFile,
          endRank,
          promotion,
        }}`
      );
      return;
    }
    const positionFen = game.value.fen();
    gameCurrentFen.value = positionFen;
    currentTurnIsWhite.value = game.value.turn() === "w";
    const lastMoveArrow = {
      fromFile: startFile,
      fromRank: startRank,
      toFile: endFile,
      toRank: endRank,
    };

    const from = "abcdefgh".charAt(startFile) + "12345678".charAt(startRank);
    const to = "abcdefgh".charAt(endFile) + "12345678".charAt(endRank);
    const logicBeforeMove = new Chess(positionFenBeforeMove);
    const san = logicBeforeMove.move({
      from,
      to,
    }).san;

    return { san, positionFen, lastMoveArrow };
  }

  const piecesValues = computed(() => {
    const currentPosition = gameCurrentFen.value;
    const boardValues = currentPosition
      .split(" ")[0]
      .split("/")
      .reverse();

    const result = [];

    for (let rank = 0; rank < 8; rank++) {
      const line = [];

      let file = 0;
      let charPosition = 0;

      while (file < 8) {
        const currentValue = boardValues[rank][charPosition];
        const valueAsDigit = currentValue.charCodeAt(0) - "0".charCodeAt(0);
        const isCorrectDigitValue = valueAsDigit >= 0 && valueAsDigit <= 9;

        if (isCorrectDigitValue) {
          // clearing as many cells as valueAsDigit requires
          for (let i = 0; i < valueAsDigit; i++) {
            line.push(undefined);
            file++;
          }
        } else {
          line.push(currentValue);
          file++;
        }

        charPosition++;
      }

      result.push(line);
    }

    return result;
  });

  function getPieceRawPath(value) {
    let rawImageName;
    switch (value) {
      case "P":
        rawImageName = "Chess_plt45.svg";
        break;
      case "N":
        rawImageName = "Chess_nlt45.svg";
        break;
      case "B":
        rawImageName = "Chess_blt45.svg";
        break;
      case "R":
        rawImageName = "Chess_rlt45.svg";
        break;
      case "Q":
        rawImageName = "Chess_qlt45.svg";
        break;
      case "K":
        rawImageName = "Chess_klt45.svg";
        break;

      case "p":
        rawImageName = "Chess_pdt45.svg";
        break;
      case "n":
        rawImageName = "Chess_ndt45.svg";
        break;
      case "b":
        rawImageName = "Chess_bdt45.svg";
        break;
      case "r":
        rawImageName = "Chess_rdt45.svg";
        break;
      case "q":
        rawImageName = "Chess_qdt45.svg";
        break;
      case "k":
        rawImageName = "Chess_kdt45.svg";
        break;
      default:
        return undefined;
    }

    return `/assets/chess_vectors/${rawImageName}`;
  }

  const piecesPaths = computed(() => {
    return piecesValues.value.map((line) =>
      line.map((item) => getPieceRawPath(item))
    );
  });

  function getRank(row, reversed) {
    return reversed ? row : 7 - row;
  }

  function getFile(col, reversed) {
    return reversed ? 7 - col : col;
  }

  function isLegalMove({ startFile, startRank, endFile, endRank }) {
    const fromCellStr =
      "abcdefgh".charAt(startFile) + "12345678".charAt(startRank);
    const toCellStr = "abcdefgh".charAt(endFile) + "12345678".charAt(endRank);
    const gameCopy = new Chess(game.value.fen());

    const result = gameCopy.move({
      from: fromCellStr,
      to: toCellStr,
      promotion: "q",
    });

    return result !== null;
  }

  function makeMove({
    startFile,
    startRank,
    endFile,
    endRank,
    promotion = "q",
  }) {
    const fromCellStr =
      "abcdefgh".charAt(startFile) + "12345678".charAt(startRank);
    const toCellStr = "abcdefgh".charAt(endFile) + "12345678".charAt(endRank);

    const moveResult = game.value.move({
      from: fromCellStr,
      to: toCellStr,
      promotion,
    });

    gameCurrentFen.value = game.value.fen();
    currentTurnIsWhite.value = game.value.turn() === "w";

    updateGameStatusIfFinished();

    return moveResult?.san || null;
  }

  function isPromotionMove({ startFile, startRank, endRank }) {
    const startCellStr =
      "abcdefgh".charAt(startFile) + "12345678".charAt(startRank);
    const movingPiece = game.value.get(startCellStr);
    const isMovingAPawn = movingPiece?.type === "p";

    if (!isMovingAPawn) return false;
    return (
      (currentTurnIsWhite.value && endRank === 7) ||
      (!currentTurnIsWhite.value && endRank === 0)
    );
  }

  function getPositionFen() {
    return game.value.fen();
  }

  function tryToSetupPositionFen(fen) {
    const allowedToLoadPosition =
      gameStatus.value != GAME_STATUS_IDLE &&
      gameStatus.value != GAME_STATUS_RUNNING;
    if (allowedToLoadPosition) {
      gameCurrentFen.value = fen;
      return true;
    }
    return false;
  }

  function isHumanTurn() {
    return (
      (currentTurnIsWhite.value &&
        whitePlayerType.value === PLAYER_TYPE_HUMAN) ||
      (!currentTurnIsWhite.value && blackPlayerType.value === PLAYER_TYPE_HUMAN)
    );
  }

  function isExternalTurn() {
    return (
      (currentTurnIsWhite.value &&
        whitePlayerType.value === PLAYER_TYPE_EXTERNAL) ||
      (!currentTurnIsWhite.value &&
        blackPlayerType.value === PLAYER_TYPE_EXTERNAL)
    );
  }

  function fillGamePgn() {
    let result;
    if (game.value.in_checkmate()) {
      const whiteTurn = game.value.turn() === "w";
      result = whiteTurn ? PGN_BLACK_WIN_STR : PGN_WHITE_WIN_STR;
    } else if (game.value.in_threefold_repetition()) {
      result = PGN_DRAW_STR;
    } else if (game.value.in_stalemate()) {
      result = PGN_DRAW_STR;
    } else if (game.value.in_draw()) {
      result = PGN_DRAW_STR;
    } else {
      result = PGN_GAME_IN_PROGRESS_STR;
    }

    const whiteHeader =
      whitePlayerType.value === PLAYER_TYPE_HUMAN ? "Player" : "Computer";
    const blackHeader =
      blackPlayerType.value === PLAYER_TYPE_HUMAN ? "Player" : "Computer";
    const date = moment().format("YYYY.MM.DD");

    game.value.header("Event", "Chess Exercises Organizer");
    game.value.header("Site", "?");
    game.value.header("Date", date);
    game.value.header("White", whiteHeader);
    game.value.header("Black", blackHeader);
    game.value.header("Result", result);

    gamePgnText.value = game.value.pgn();
  }

  function getGamePgn() {
    return gamePgnText.value;
  }

  const isWhiteTurn = computed(() => currentTurnIsWhite.value);

  return {
    getRank,
    getFile,
    piecesValues,
    piecesPaths,
    isWhiteTurn,
    isLegalMove,
    makeMove,
    isPromotionMove,
    startNewGame,
    stopCurrentGame,
    getGameStatus,
    getPositionFen,
    tryToSetupPositionFen,
    resetPlayerTypes,
    isHumanTurn,
    isExternalTurn,
    makeExternalMove,
    addPositionFenToOccurences,
    getGamePgn,
    GAME_STATUS_IDLE,
    GAME_STATUS_RUNNING,
    GAME_STATUS_WHITE_WIN,
    GAME_STATUS_BLACK_WIN,
    GAME_STATUS_DRAW_STALEMATE,
    GAME_STATUS_DRAW_THREE_FOLD_REPETITION,
    GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL,
    GAME_STATUS_DRAW_FIFTY_MOVES_RULE,
    PLAYER_TYPE_HUMAN,
    PLAYER_TYPE_EXTERNAL,
  };
}
