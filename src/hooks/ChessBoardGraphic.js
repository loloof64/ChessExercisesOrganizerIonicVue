export default function useChessBoardGraphic() {
  const sizePixels = function(boardSizePx) {
    const sizePx = boardSizePx;
    return sizePx + "px";
  };

  const cellsSizePixels = function(boardSizePx) {
    const sizePx = boardSizePx;
    const cellsSizePx = sizePx / 9.0 + "px";
    return cellsSizePx;
  };

  const coordinatesFontSize = function(boardSizePx) {
    const cellsSize = boardSizePx / 9.0;
    return Math.floor(cellsSize * 0.4) + "px";
  };

  function topBottomCoordinateValue(col, reversed) {
    const possibleValues = reversed ? "HGFEDCBA" : "ABCDEFGH";
    return possibleValues.charAt(col);
  }

  function leftRightCoordinateValue(row, reversed) {
    const possibleValues = reversed ? "12345678" : "87654321";
    return possibleValues.charAt(row);
  }

  function cellBackgroundClass(row, col) {
    const isWhiteCell = (row + col) % 2 == 0;
    return isWhiteCell ? "whiteCell" : "blackCell";
  }

  return {
      sizePixels,
      cellsSizePixels,
      coordinatesFontSize,
      topBottomCoordinateValue,
      leftRightCoordinateValue,
      cellBackgroundClass
  };
}
