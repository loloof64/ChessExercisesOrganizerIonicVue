import Chess from "chess.js";

let elementIndex = 0;
let elementList = [];

export default function convertPgnDataToHistory(pgnData) {
  const result = {};
  const fenTagValue = pgnData.headers.find((it) => it.name === "FEN");
  const startPosition =
    fenTagValue?.value ||
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const firstMoveForWhite = startPosition.split(" ")[1] === "w";

  parseMoves(pgnData.moves, new Chess(startPosition), firstMoveForWhite);

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

function parseMoves(movesArray, gameState, firstMoveForWhite = true) {
  let whiteTurn = firstMoveForWhite;
  let mustAddMoveNumberReminder = false;

  for (const [index, move] of movesArray.entries()) {
    if (index === 0) {
      const moveNumberText = `${move.move_number}.${whiteTurn ? "" : ".."}`;
      elementList.push({
        text: moveNumberText,
      });
      elementIndex++;
    } else if (whiteTurn || mustAddMoveNumberReminder) {
      const moveNumberText = `${move.move_number}.${whiteTurn ? "" : ".."}`;
      elementList.push({
        text: moveNumberText,
      });
      elementIndex++;
      mustAddMoveNumberReminder = false;
    }

    const fenBeforeMove = gameState.fen();
    const moveSan = move.move;
    let text = moveSan
      ? convertSanToFan({ moveSan, whiteTurn: gameState.turn() === "w" })
      : move;

    if (move.nags) {
      text = appendNagToText(text, move.nags);
    }
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

    whiteTurn = !whiteTurn;
    elementIndex++;

    if ((move.ravs?.length || 0) > 0) {
      mustAddMoveNumberReminder = true;
      for (const currentVariation of move.ravs) {
        const startParenthesis = {
          index: elementIndex,
          text: "(",
        };
        elementList.push(startParenthesis);
        elementIndex++;

        const gameStateBeforeMoveClone = new Chess(fenBeforeMove);
        const firstMoveForWhite = fenBeforeMove.split(" ")[1] === "w";
        parseMoves(
          currentVariation.moves,
          gameStateBeforeMoveClone,
          firstMoveForWhite
        );

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

function appendNagToText(text, nagArray) {
  for (const nag of nagArray) {
    text += convertNagToUnicode(nag);
  }

  return text;
}

function convertNagToUnicode(nag) {
  switch (nag) {
    case "$1":
      return "\u0021";
    case "$2":
      return "\u003F";
    case "$3":
      return "\u203C";
    case "$4":
      return "\u2047";
    case "$5":
      return "\u2049";
    case "$6":
      return "\u2048";
    case "$7":
      return "\u25A1";
    case "$10":
      return "\u003D";
    case "$13":
      return "\u221E";
    case "$14":
      return "\u2A72";
    case "$15":
      return "\u2A71";
    case "$16":
      return "\u00B1";
    case "$17":
      return "\u2213";
    case "$18":
      return "\u002B\u002D";
    case "$19":
      return "\u002D\u002B";
    case "$22":
    case "$23":
      return "\u2A00";
    case "$32":
    case "$33":
      return "\u27F3";
    case "$36":
    case "$37":
      return "\u2192";
    case "$40":
    case "$41":
      return "\u2191";
    case "$45":
    case "$46":
      return "\u2A73";
    case "$131":
    case "$132":
      return "\u21C6";
    case "$138":
    case "$139":
      return "\u2A01";
    default:
      return nag;
  }
}
