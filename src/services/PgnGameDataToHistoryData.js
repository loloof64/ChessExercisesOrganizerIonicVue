import Chess from "chess.js";

let result = {};

export default function convertPgnDataToHistory(pgnData) {
  result = {};
  const fenTagValue = pgnData.tags["FEN"];
  const startPosition =
    fenTagValue || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  result["startPosition"] = startPosition;
  result["elements"] = parseMoves(pgnData.moves, new Chess(startPosition));

  return result;
}

function getCoordinatesOf(coordsStr) {
  const file = coordsStr.charCodeAt(0) - "a".charCodeAt(0);
  const rank = coordsStr.charCodeAt(1) - "1".charCodeAt(0);
  return { file, rank };
}

function parseMoves(movesArray, gameState) {
  let result = [];
  let elementIndex = 0;
  for (const [index, move] of movesArray.entries()) {
    if (index === 0) {
      const moveNumberText = `${move.moveNumber}.${
        move.turn === "b" ? ".." : ""
      }`;
      result.push({
        text: moveNumberText,
      });
      elementIndex++;
    } else if (move.turn === "w") {
      const moveNumberText = `${move.moveNumber}.`;
      result.push({
        text: moveNumberText,
      });
      elementIndex++;
    }

    const moveSan = move.notation?.notation;
    const moveFan = moveSan; // todo convert to fan
    const text = moveFan || move;

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
    result.push(element);
    elementIndex++;
  }
  return result;
}
