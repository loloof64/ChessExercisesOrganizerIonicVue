import { reactive } from "vue";

export default function useChessBoardDragAndDrop() {
  const dndState = reactive({
    started: false,
    startFile: null,
    startRank: null,
    endFile: null,
    endRank: null,
    draggedPieceX: null,
    draggedPieceY: null,
    draggedPieceSrc: null,
  });

  const pendingPromotionMove = reactive({});

  function resetDndState() {
    dndState.started = false;
    dndState.startFile = null;
    dndState.startRank = null;
    dndState.endFile = null;
    dndState.endRank = null;
    dndState.draggedPieceX = null;
    dndState.draggedPieceY = null;
    dndState.draggedPieceSrc = null;
  }

  function handleDragStart({
    detail,
    boardSizePx,
    reversed,
    piecesValues,
    piecesPaths,
    whiteTurn,
  }) {
    const x = detail.srcEvent.offsetX;
    const y = detail.srcEvent.offsetY;

    const cellsSize = boardSizePx / 9.0;
    const col = Math.floor((x - cellsSize * 0.5) / cellsSize);
    const row = Math.floor((y - cellsSize * 0.5) / cellsSize);

    const file = reversed ? 7 - col : col;
    const rank = reversed ? row : 7 - row;

    if (file < 0 || file > 7 || rank < 0 || rank > 7) return;
    const cellValue = piecesValues.value[rank][file];

    if ([undefined, null].includes(cellValue)) return;
    const isWhitePiece = ["P", "N", "B", "R", "Q", "K"].includes(cellValue);
    const isBlackPiece = ["p", "n", "b", "r", "q", "k"].includes(cellValue);
    const isPlayerInTurnPiece =
      (whiteTurn && isWhitePiece) || (!whiteTurn && isBlackPiece);

    if (!isPlayerInTurnPiece) return;

    dndState.started = true;

    dndState.startFile = file;
    dndState.startRank = rank;
    dndState.endFile = file;
    dndState.endRank = rank;

    dndState.draggedPieceX = x - cellsSize * 0.5;
    dndState.draggedPieceY = y - cellsSize * 0.5;

    dndState.draggedPieceSrc = piecesPaths.value[rank][file];
  }

  function handleDragEnd({
    isLegalMove,
    makeMove,
    isPromotionMove,
    requestPromotionSelection,
  }) {
    let san;
    const moveObject = {
      startFile: dndState.startFile,
      startRank: dndState.startRank,
      endFile: dndState.endFile,
      endRank: dndState.endRank,
      promotion: "q",
    };

    if (isLegalMove(moveObject)) {
      if (isPromotionMove(moveObject)) {
        pendingPromotionMove.startFile = moveObject.startFile;
        pendingPromotionMove.startRank = moveObject.startRank;
        pendingPromotionMove.endFile = moveObject.endFile;
        pendingPromotionMove.endRank = moveObject.endRank;

        const lastMoveCoordinates = {
          startFile: moveObject.startFile,
          startRank: moveObject.startRank,
          endFile: moveObject.endFile,
          endRank: moveObject.endRank,
        };

        requestPromotionSelection();
        return { san: undefined, lastMoveCoordinates, isPromotion: true };
      }
      san = makeMove(moveObject);
    }
    resetDndState();
    const lastMoveCoordinates = {
      fromFile: moveObject.startFile,
      fromRank: moveObject.startRank,
      toFile: moveObject.endFile,
      toRank: moveObject.endRank,
    };
    return { san, lastMoveCoordinates };
  }

  function handleDragCancel() {
    resetDndState();
  }

  function handleDragMove({ detail, boardSizePx, reversed }) {
    if (!dndState.started) return;

    const x = detail.srcEvent.offsetX;
    const y = detail.srcEvent.offsetY;

    const cellsSize = boardSizePx / 9.0;
    const col = Math.floor((x - cellsSize * 0.5) / cellsSize);
    const row = Math.floor((y - cellsSize * 0.5) / cellsSize);

    const file = reversed ? 7 - col : col;
    const rank = reversed ? row : 7 - row;

    dndState.endFile = file;
    dndState.endRank = rank;

    dndState.draggedPieceX = x - cellsSize * 0.5;
    dndState.draggedPieceY = y - cellsSize * 0.5;
  }

  function terminatePromotionMove({ type, makeMove, onPromotionMoveDone }) {
    const moveObject = {
      startFile: pendingPromotionMove.startFile,
      startRank: pendingPromotionMove.startRank,
      endFile: pendingPromotionMove.endFile,
      endRank: pendingPromotionMove.endRank,
      promotion: type,
    };

    pendingPromotionMove.startFile = undefined;
    pendingPromotionMove.startRank = undefined;
    pendingPromotionMove.endFile = undefined;
    pendingPromotionMove.endRank = undefined;

    const san = makeMove(moveObject);

    if (onPromotionMoveDone) onPromotionMoveDone(san);

    resetDndState();
  }

  return {
    dndState,
    resetDndState,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    handleDragCancel,
    terminatePromotionMove,
  };
}
