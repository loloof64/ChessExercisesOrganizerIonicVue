function getSelectedGameGoalTranslation(selectedGame, localeStr) {
  return selectedGame?.headers?.find(
    (item) => item.name === `Goal_${localeStr}`
  )?.value;
}

function getSelectedGameGoal(selectedGame, currentLocale) {
  let newGoalText = "";
  const defaultGoalText = selectedGame?.headers?.find(
    (item) => item.name === "Goal"
  )?.value;

  const englishGoalText = getSelectedGameGoalTranslation(selectedGame, "en");
  const currentLocaleGoalText = getSelectedGameGoalTranslation(
    selectedGame,
    currentLocale
  );

  if (currentLocaleGoalText) {
    newGoalText = currentLocaleGoalText;
  } else if (englishGoalText) {
    newGoalText = englishGoalText;
  } else if (defaultGoalText) {
    newGoalText = defaultGoalText;
  }
  
  return newGoalText;
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

export default function usePgnUtils() {
  return {
    convertSanToFan,
    convertNagToUnicode,
    getSelectedGameGoal,
  };
}
