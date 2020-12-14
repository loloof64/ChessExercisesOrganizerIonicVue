export default class ChessEngineCommunication {
  constructor(onMessageCallBack) {
    this.onMessage = onMessageCallBack;
    this.initStockfishJs();
  }

  initStockfishJs() {
    const wasmSupported =
      typeof WebAssembly === "object" &&
      WebAssembly.validate(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
    if (!wasmSupported) throw "Wasm not supported !";
    this.stockfish = new Worker("/assets/stockfish-js/stockfish.js");
    this.stockfish.addEventListener("message", (event) => {
      if (this.onMessage) this.onMessage(event.data);
    });
    this.stockfish.postMessage("uci");
  }
}
