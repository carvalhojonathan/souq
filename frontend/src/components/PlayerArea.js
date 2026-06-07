import React from "react";
import Card from "./Card";
import { FaAward, FaTimes } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";

export default function PlayerArea({
  isOpponent,
  playerName,
  hand,
  herdCount,
  seals,
  tokens = [],
  selectedHandCards = [],
  onSelectCard,
  selectedHerdCount = 0,
  onHerdSelect,
  isMyTurn = false,
  className = "",
}) {
  const visibleSum = tokens.reduce(
    (sum, t) => (t.type === "good" ? sum + t.value : sum),
    0,
  );

  const bonusTokens = tokens.filter(
    (t) => t.type === "bonus" || t.id?.includes("bonus") || t.name === "bonus",
  );

  const secretSum = bonusTokens.reduce((sum, t) => sum + t.value, 0);
  const secretCount = bonusTokens.length;
  const totalSum = visibleSum + secretSum;

  const renderHand = () => {
    if (isOpponent) {
      return Array.from({ length: hand }).map((_, i) => (
        <div
          key={`opp-card-${i}`}
          className="flex-shrink-0 w-[55px] max-w-[55px] sm:w-[70px] sm:max-w-[70px] md:w-[85px] md:max-w-[85px] transition-all duration-300"
        >
          <Card type="back" hidden={true} />
        </div>
      ));
    }

    return hand.map((cardType, index) => (
      <div
        key={`my-card-${index}`}
        className="flex-shrink-0 w-[65px] max-w-[65px] sm:w-[80px] sm:max-w-[80px] md:w-[95px] md:max-w-[95px] transition-all duration-300"
      >
        <Card
          type={cardType}
          isSelected={selectedHandCards.includes(index)}
          onClick={() => {
            if (isMyTurn) onSelectCard(index);
          }}
        />
      </div>
    ));
  };

  const areaStyle = isOpponent
    ? "bg-gray-50 dark:bg-gray-800 border-jaipur-red dark:border-red-900/50"
    : "bg-white dark:bg-gray-800 border-jaipur-green dark:border-green-900/50";

  return (
    <div
      className={`p-2 shadow-sm border-2 transition-colors flex flex-col min-w-0 ${areaStyle} ${className}`}
    >
      <div className="flex justify-between items-center mb-2 px-2 flex-shrink-0 flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-1.5">
        <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
          <h2
            className={`font-display font-bold text-sm md:text-base tracking-wide ${
              isOpponent
                ? "text-jaipur-red dark:text-red-400"
                : "text-jaipur-green dark:text-green-400"
            }`}
          >
            {isOpponent
              ? `👤 ${playerName || "Oponente"}`
              : `🐫 ${playerName || "Você"}`}
          </h2>

          <span className="text-gray-300 dark:text-gray-600 font-bold hidden sm:inline">
            |
          </span>

          <div className="flex items-center gap-1 font-display font-bold text-sm md:text-base text-gray-700 dark:text-gray-200">
            {isOpponent ? (
              <>
                <span>{visibleSum}</span>
                {secretCount > 0 && (
                  <span className="text-xs opacity-70 ml-0.5">(+?)</span>
                )}
              </>
            ) : (
              <>
                <span>{totalSum}</span>
                <span className="text-xs opacity-70 ml-0.5">
                  ({visibleSum})
                </span>
              </>
            )}
          </div>

          {bonusTokens.length > 0 && (
            <div className="flex items-center gap-0.5 ml-1">
              {bonusTokens.map((t, i) => (
                <div
                  key={i}
                  className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-600 border border-green-700 flex items-center justify-center text-white text-[9px] md:text-[10px] font-bold shadow-sm"
                  title="Ficha Bônus"
                >
                  {isOpponent ? "?" : t.value}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-auto">
          {Array.from({ length: 2 }).map((_, i) => (
            <FaAward
              key={i}
              className={`text-lg transition-colors ${
                i < seals
                  ? "text-jaipur-gold drop-shadow-sm"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-row items-center justify-between min-h-[7rem] md:min-h-[8rem] p-2 pr-3 sm:pr-4 bg-desert-light dark:bg-gray-900 rounded border border-desert-dark dark:border-gray-700 w-full transition-colors relative overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 md:gap-4 flex-grow min-w-max pr-2">
          <AnimatePresence>{renderHand()}</AnimatePresence>

          {!isOpponent && hand.length === 0 && (
            <span className="text-gray-400 dark:text-gray-500 italic text-xs h-16 md:h-24 flex items-center px-2 w-full">
              Mão vazia
            </span>
          )}
        </div>

        {!isOpponent && herdCount > 0 && (
          <div className="ml-2 sm:ml-auto pl-3 sm:pl-4 border-l-2 border-dashed border-gray-400 dark:border-gray-600 flex flex-col items-center justify-center transition-colors flex-shrink-0 mr-1">
            <div className="w-[50px] max-w-[50px] sm:w-[70px] sm:max-w-[70px] md:w-[85px] md:max-w-[85px] flex-shrink-0">
              <Card type="camel" count={herdCount} />
            </div>

            <div className="mt-1 md:mt-2 flex items-center gap-0.5 md:gap-1">
              <button
                onClick={() => onHerdSelect(0)}
                disabled={selectedHerdCount === 0}
                className={`bg-jaipur-red dark:bg-red-700 text-white rounded-full p-1 shadow-sm transition-colors ${
                  selectedHerdCount === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-80"
                }`}
              >
                <FaTimes size={10} />
              </button>

              <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-300 dark:border-gray-600 text-[9px] md:text-[10px] transition-colors">
                <button
                  onClick={() =>
                    onHerdSelect(Math.max(0, selectedHerdCount - 1))
                  }
                  className={`px-1.5 md:px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white font-bold rounded-l-full transition-colors ${
                    !isMyTurn || selectedHerdCount === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  disabled={!isMyTurn || selectedHerdCount === 0}
                >
                  -
                </button>

                <span className="font-bold dark:text-white transition-colors w-5 md:w-6 flex items-center justify-center text-center">
                  {selectedHerdCount}
                </span>

                <button
                  onClick={() =>
                    onHerdSelect(Math.min(herdCount, selectedHerdCount + 1))
                  }
                  className={`px-1.5 md:px-2 py-1 bg-jaipur-green dark:bg-green-700 text-white font-bold rounded-r-full transition-colors ${
                    !isMyTurn || selectedHerdCount === herdCount
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-80"
                  }`}
                  disabled={!isMyTurn || selectedHerdCount === herdCount}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {isOpponent && herdCount > 0 && (
          <div className="ml-2 sm:ml-auto pl-3 sm:pl-4 border-l-2 border-dashed border-gray-400 dark:border-gray-600 flex flex-col items-center justify-center transition-colors flex-shrink-0 mr-1">
            <div className="w-[40px] max-w-[40px] sm:w-[60px] sm:max-w-[60px] md:w-[75px] md:max-w-[75px] flex-shrink-0">
              <Card type="camel" count={herdCount > 0 ? "?" : undefined} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
