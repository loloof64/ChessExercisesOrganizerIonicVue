import Chess from "chess.js";

let elementIndex = 0;
let elementList = [];

export default function convertPgnDataToHistory(pgnData) {
  const result = {};
  const fenTagValue = pgnData.tags["FEN"];
  const startPosition =
    fenTagValue || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  parseMoves(pgnData.moves, new Chess(startPosition));

  result["startPosition"] = startPosition;
  result["elements"] = elementList;

  return result;
}

function convertSanToFan({ moveSan, whiteTurn }) {
  moveSan = moveSan
    .replace(/K/g, whiteTurn ? "\u2654" : "\u265A")
    .normalize("NFKC");
  moveSan = moveSan
    .replace(/Q/g, whiteTurn ? "\u2655" : "\u265B")
    .normalize("NFKC");
  moveSan = moveSan
    .replace(/R/g, whiteTurn ? "\u2656" : "\u265C")
    .normalize("NFKC");
  moveSan = moveSan
    .replace(/B/g, whiteTurn ? "\u2657" : "\u265D")
    .normalize("NFKC");
  moveSan = moveSan
    .replace(/N/g, whiteTurn ? "\u2658" : "\u265E")
    .normalize("NFKC");

  return moveSan;
}

function getCoordinatesOf(coordsStr) {
  const file = coordsStr.charCodeAt(0) - "a".charCodeAt(0);
  const rank = coordsStr.charCodeAt(1) - "1".charCodeAt(0);
  return { file, rank };
}

function parseMoves(movesArray, gameState) {
  for (const [index, move] of movesArray.entries()) {
    if (index === 0) {
      const moveNumberText = `${move.moveNumber}.${
        move.turn === "b" ? ".." : ""
      }`;
      elementList.push({
        text: moveNumberText,
      });
      elementIndex++;
    } else if (move.turn === "w") {
      const moveNumberText = `${move.moveNumber}.`;
      elementList.push({
        text: moveNumberText,
      });
      elementIndex++;
    }

    const fenBeforeMove = gameState.fen();
    const moveSan = move.notation?.notation;
    const text = moveSan
      ? convertSanToFan({ moveSan, whiteTurn: gameState.turn() === "w" })
      : move;

    let fen;
    let lastMoveArrow;

    const moveResult = gameState.move(moveSan);
    if (moveSan) {
      if (!moveResult) {
        throw `Illegal move ${moveSan} (number = ${move.moveNumber}, turn = ${move.turn})`;
      }
      fen = gameState.fen();
      const from = getCoordinatesOf(moveResult.from);
      const to = getCoordinatesOf(moveResult.to);
      lastMoveArrow = {
        fromFile: from.file,
        fromRank: from.rank,
        toFile: to.file,
        toRank: to.rank,
      };
    }

    const element = {
      index: elementIndex,
      text,
      fen,
      lastMoveArrow,
    };
    elementList.push(element);
    elementIndex++;

    if ((move.variations?.length || 0) > 0) {
      for (const currentVariation of move.variations) {
        const startParenthesis = {
          index: elementIndex,
          text: "(",
        };
        elementList.push(startParenthesis);
        elementIndex++;

        const gameStateBeforeMoveClone = new Chess(fenBeforeMove);
        parseMoves(currentVariation, gameStateBeforeMoveClone);

        const endParenthesis = {
          index: elementIndex,
          text: ")",
        };
        elementList.push(endParenthesis);
        elementIndex++;
      }
    }
  }

}
