import Chess from "chess.js";
import { reactive, watch } from "vue";

export default function useChessBoardLogic() {
  const game = reactive({
    handler: new Chess("8/8/8/8/8/8/8/8 w - - 0 1"),
  });

  const piecesValues = reactive({
    raws: [],
    paths: [],
  });

  function startNewGame(
    startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ) {
    game.handler = new Chess(startPosition);
  }

  function getPiecesValues() {
    const currentPosition = game.handler.fen();
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

    return result.reverse();
  }

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

  function getRank(row, reversed) {
    return reversed ? 7 - row : row;
  }

  function getFile(col, reversed) {
    return reversed ? 7 - col : col;
  }

  function isEmptyCell(rank, file) {
    return piecesValues.raws[rank][file] === undefined;
  }

  function isWhiteTurn() {
    return game.handler.turn() === "w";
  }

  function updatePieces() {
    piecesValues.raws = getPiecesValues();
    piecesValues.paths = piecesValues.raws.map((line) =>
      line.map((cellValue) => getPieceRawPath(cellValue))
    );
  }

  watch(game, function() {
    updatePieces();
  });

  return {
    startNewGame,
    isEmptyCell,
    isWhiteTurn,
    getRank,
    getFile,
    piecesValues,
  };
}
