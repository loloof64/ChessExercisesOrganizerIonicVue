import Chess from "chess.js";
import { ref, computed } from "vue";

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

  const game = ref(new Chess("8/8/8/8/8/8/8/8 w - - 0 1"));
  const gameStatus = ref(GAME_STATUS_IDLE);

  function getGameStatus() {
    return gameStatus.value;
  }

  function updateGameStatusIfFinished() {
    if (game.value.in_checkmate()) {
      const isWhiteTurn = game.value.turn() === "w";
      gameStatus.value = isWhiteTurn
        ? GAME_STATUS_BLACK_WIN
        : GAME_STATUS_WHITE_WIN;
    } else if (game.value.in_stalemate()) {
      gameStatus.value = GAME_STATUS_DRAW_STALEMATE;
    } else if (game.value.in_threefold_repetition()) {
      gameStatus.value = GAME_STATUS_DRAW_THREE_FOLD_REPETITION;
    } else if (game.value.insufficient_material()) {
      gameStatus.value = GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL;
    } else if (game.value.in_draw()) {
      gameStatus.value = GAME_STATUS_DRAW_FIFTY_MOVES_RULE;
    }
  }

  function startNewGame(
    startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ) {
    game.value = new Chess(startPosition);
    gameStatus.value = GAME_STATUS_RUNNING;
  }

  function stopCurrentGame() {
    gameStatus.value = GAME_STATUS_STOPPED;
  }

  const piecesValues = computed(() => {
    const currentPosition = game.value.fen();
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

  const isWhiteTurn = computed(() => {
    return game.value.turn() === "w";
  });

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

    game.value = new Chess(game.value.fen());
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
      (isWhiteTurn.value && endRank === 7) ||
      (!isWhiteTurn.value && endRank === 0)
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
      const newGame = new Chess();
      if (newGame.load(fen)) {
        game.value = newGame;
        return true;
      }
      return false;
    }
    return false;
  }

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
    GAME_STATUS_IDLE,
    GAME_STATUS_RUNNING,
    GAME_STATUS_WHITE_WIN,
    GAME_STATUS_BLACK_WIN,
    GAME_STATUS_DRAW_STALEMATE,
    GAME_STATUS_DRAW_THREE_FOLD_REPETITION,
    GAME_STATUS_DRAW_INSUFFICIENT_MATERIAL,
    GAME_STATUS_DRAW_FIFTY_MOVES_RULE,
  };
}
