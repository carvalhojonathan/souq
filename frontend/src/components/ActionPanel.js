import React from "react";
import {
  FaStore,
  FaExchangeAlt,
  FaCoins,
  FaHandPaper,
  FaArrowRight,
  FaHome,
} from "react-icons/fa";

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
  isReviewingBoard,
  matchWinner,
  onContinueRound,
  onLeaveMatch,
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
  const hasCommon = selectedHand.some((card) => selectedMarket.includes(card));

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
    expectedHandSizeAfterTrade <= 7 &&
    !hasCommon;
  const canSell =
    selectedHand.length > 0 &&
    selectedMarket.length === 0 &&
    selectedHerdCount === 0 &&
    selectedHand.every((c) => c === selectedHand[0]) &&
    (!["diamond", "gold", "silver"].includes(selectedHand[0]) ||
      selectedHand.length >= 2);

  return (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-jaipur-gold dark:border-gray-700 flex items-stretch h-full gap-2 transition-colors">
      {isReviewingBoard ? (
        <div className="flex-grow flex items-center justify-center w-full">
          {matchWinner ? (
            <button
              onClick={onLeaveMatch}
              className="w-full h-full bg-jaipur-gold hover:bg-yellow-600 text-white font-bold rounded shadow-md flex items-center justify-center gap-2 transition-all uppercase text-sm md:text-lg"
            >
              <FaHome /> Tela Inicial
            </button>
          ) : (
            <button
              onClick={onContinueRound}
              className="w-full h-full bg-jaipur-green hover:bg-green-700 text-white font-bold rounded shadow-md flex items-center justify-center gap-2 transition-all uppercase text-sm md:text-lg"
            >
              Continuar Partida <FaArrowRight />
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`flex flex-col items-center justify-center p-1 rounded border-2 w-[80px] md:w-[100px] flex-shrink-0 transition-colors shadow-sm ${isMyTurn ? "bg-jaipur-green border-green-700 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"}`}
          >
            <div className="text-[9px] md:text-[10px] font-bold text-center uppercase leading-tight tracking-wider flex flex-col items-center justify-center">
              {isMyTurn ? (
                <>
                  <span>SUA</span>
                  <span>VEZ</span>
                </>
              ) : (
                <>
                  <span>AGUARDANDO</span>
                  <span>OPONENTE</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 md:gap-2 flex-grow">
            <button
              onClick={() =>
                handleAction("TAKE_ONE", {
                  marketIndex: selectedMarketIndices[0],
                })
              }
              disabled={!isMyTurn || !canTakeOne}
              className={`flex flex-row items-center justify-center py-1.5 px-1 md:px-2 gap-1.5 md:gap-2 rounded border-2 transition-all shadow-sm ${isMyTurn && canTakeOne ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"}`}
            >
              <span className="text-[10px] md:text-xs font-bold leading-tight">
                Comprar
              </span>
              <FaHandPaper className="text-sm md:text-lg flex-shrink-0" />
            </button>

            <button
              onClick={() => handleAction("TAKE_CAMELS", {})}
              disabled={!isMyTurn || !canTakeCamels}
              className={`flex flex-row items-center justify-center py-1.5 px-1 md:px-2 gap-1.5 md:gap-2 rounded border-2 transition-all shadow-sm ${isMyTurn && canTakeCamels ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"}`}
            >
              <span className="text-[10px] md:text-xs font-bold leading-tight">
                Camelos
              </span>
              <FaStore className="text-sm md:text-lg flex-shrink-0" />
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
              className={`flex flex-row items-center justify-center py-1.5 px-1 md:px-2 gap-1.5 md:gap-2 rounded border-2 transition-all shadow-sm ${isMyTurn && canTrade ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"}`}
            >
              <span className="text-[10px] md:text-xs font-bold leading-tight">
                Trocar
              </span>
              <FaExchangeAlt className="text-sm md:text-lg flex-shrink-0" />
            </button>

            <button
              onClick={() =>
                handleAction("SELL_GOODS", { handIndices: selectedHandIndices })
              }
              disabled={!isMyTurn || !canSell}
              className={`flex flex-row items-center justify-center py-1.5 px-1 md:px-2 gap-1.5 md:gap-2 rounded border-2 transition-all shadow-sm ${isMyTurn && canSell ? "border-jaipur-green bg-green-50 dark:bg-green-900/30 dark:border-green-500 text-jaipur-green dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50"}`}
            >
              <span className="text-[10px] md:text-xs font-bold leading-tight">
                Vender
              </span>
              <FaCoins className="text-sm md:text-lg flex-shrink-0" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
