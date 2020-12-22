import Chess from "chess.js";
import usePgnUtils from "@/hooks/PgnUtils";

const { convertSanToFan, convertNagToUnicode } = usePgnUtils();

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
