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

  function handleDragStart({detail, boardSizePx, reversed, piecesValues, piecesPaths, whiteTurn}) {
    const rootEl = document.querySelector(".board_root");
    const x = detail.currentX - rootEl.offsetLeft;
    const y = detail.currentY - rootEl.offsetTop;

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

    dndState.draggedPieceX = x - cellsSize * 0.5;
    dndState.draggedPieceY = y - cellsSize * 0.5;

    dndState.draggedPieceSrc = piecesPaths.value[rank][file];
  }

  function handleDragEnd({
    isLegalMove, makeMove,
  }) {
    const moveObject = {
      startFile: dndState.startFile,
      startRank: dndState.startRank,
      endFile: dndState.endFile,
      endRank: dndState.endRank,
      promotion: 'q'
    };

    if (isLegalMove(moveObject)) makeMove(moveObject);
    resetDndState();
  }

  function handleDragMove({detail, boardSizePx, reversed}) {
    if (!dndState.started) return;

    const rootEl = document.querySelector(".board_root");
    const x = detail.currentX - rootEl.offsetLeft;
    const y = detail.currentY - rootEl.offsetTop;

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

  return {
    dndState,
    resetDndState,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
  };
}
