import React from "react";
import { FaStore, FaExchangeAlt, FaCoins, FaHandPaper } from "react-icons/fa";

export default function ActionPanel({
  socket,
  roomId,
  isMyTurn,
  myPlayer,
  gameState,
  selectedHand,
  selectedHandIndices,
  selectedMarket,
  selectedMarketIndices,
  selectedHerdCount,
  clearSelection,
}) {
  const handleAction = (type, payload) => {
    socket.emit("playAction", roomId, { type, payload });
    clearSelection();
  };

  const selectedTotalToTrade = selectedHand.length + selectedHerdCount;
  const selectedMarketCamels = selectedMarket.filter(
    (c) => c === "camel",
  ).length;

  const expectedHandSizeAfterTrade =
    myPlayer.hand.length + selectedMarket.length - selectedHand.length;

  const canTakeOne =
    selectedMarket.length === 1 &&
    selectedMarket[0] !== "camel" &&
    selectedTotalToTrade === 0 &&
    myPlayer.hand.length < 7;

  const canTakeCamels =
    selectedMarket.length > 0 &&
    selectedMarket.every((c) => c === "camel") &&
    selectedTotalToTrade === 0;

  const canTrade =
    selectedMarket.length > 1 &&
    selectedMarket.length === selectedTotalToTrade &&
    selectedMarketCamels === 0 &&
    expectedHandSizeAfterTrade <= 7;

  const canSell =
    selectedHand.length > 0 &&
    selectedMarket.length === 0 &&
    selectedHerdCount === 0 &&
    selectedHand.every((c) => c === selectedHand[0]) &&
    (!["diamond", "gold", "silver"].includes(selectedHand[0]) ||
      selectedHand.length >= 2);

  return (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-jaipur-gold dark:border-gray-700 flex items-stretch h-full gap-2 transition-colors">
      <div
        className={`flex flex-col items-center justify-center p-2 rounded border-2 w-[80px] md:w-[100px] flex-shrink-0 transition-colors shadow-sm ${
          isMyTurn
            ? "bg-jaipur-green border-green-700 text-white animate-pulse"
            : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
        }`}
      >
        <span className="text-[9px] md:text-[10px] font-bold text-center uppercase leading-tight tracking-wider">
          {isMyTurn ? "SUA VEZ" : "AGUARDANDO OPONENTE"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 md:gap-2 flex-grow">
        <button
          onClick={() =>
            handleAction("TAKE_ONE", { marketIndex: selectedMarketIndices[0] })
          }
          disabled={!isMyTurn || !canTakeOne}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded border-2 transition-all shadow-sm touch-none ${
            isMyTurn && canTakeOne
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"
          }`}
        >
          <FaHandPaper className="text-sm md:text-lg mb-0.5" />
          <span className="text-[8px] md:text-[10px] font-bold text-center leading-tight">
            Comprar
            <br />1 Carta
          </span>
        </button>

        <button
          onClick={() => handleAction("TAKE_CAMELS", {})}
          disabled={!isMyTurn || !canTakeCamels}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded border-2 transition-all shadow-sm touch-none ${
            isMyTurn && canTakeCamels
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"
          }`}
        >
          <FaStore className="text-sm md:text-lg mb-0.5" />
          <span className="text-[8px] md:text-[10px] font-bold text-center leading-tight">
            Comprar
            <br />
            Camelos
          </span>
        </button>

        <button
          onClick={() =>
            handleAction("TAKE_SEVERAL", {
              marketIndices: selectedMarketIndices,
              handIndices: selectedHandIndices,
              herdCount: selectedHerdCount,
            })
          }
          disabled={!isMyTurn || !canTrade}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded border-2 transition-all shadow-sm touch-none ${
            isMyTurn && canTrade
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"
          }`}
        >
          <FaExchangeAlt className="text-sm md:text-lg mb-0.5" />
          <span className="text-[8px] md:text-[10px] font-bold text-center leading-tight">
            Trocar
            <br />
            Cartas
          </span>
        </button>

        <button
          onClick={() =>
            handleAction("SELL_GOODS", { handIndices: selectedHandIndices })
          }
          disabled={!isMyTurn || !canSell}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded border-2 transition-all shadow-sm touch-none ${
            isMyTurn && canSell
              ? "border-jaipur-green bg-green-50 dark:bg-green-900/30 dark:border-green-500 text-jaipur-green dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"
          }`}
        >
          <FaCoins className="text-sm md:text-lg mb-0.5" />
          <span className="text-[8px] md:text-[10px] font-bold text-center leading-tight">
            Vender
            <br />
            Mercad.
          </span>
        </button>
      </div>
    </div>
  );
}
