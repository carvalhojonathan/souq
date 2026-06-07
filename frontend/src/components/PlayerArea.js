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

  const handCount = isOpponent ? hand : hand.length;

  const handCardSize =
    handCount >= 6
      ? "w-[38px] h-[50px] xs:w-[42px] xs:h-[55px] sm:w-[58px] sm:h-[76px] md:w-[72px] md:h-[94px] lg:w-[82px] lg:h-[107px]"
      : "w-[48px] h-[63px] xs:w-[52px] xs:h-[68px] sm:w-[70px] sm:h-[92px] md:w-[84px] md:h-[110px] lg:w-[96px] lg:h-[125px]";

  const herdCardSize = isOpponent
    ? "w-[42px] h-[55px] xs:w-[46px] xs:h-[60px] sm:w-[56px] sm:h-[74px] md:w-[66px] md:h-[86px] lg:w-[74px] lg:h-[97px]"
    : "w-[42px] h-[55px] xs:w-[46px] xs:h-[60px] sm:w-[60px] sm:h-[78px] md:w-[70px] md:h-[92px] lg:w-[78px] lg:h-[102px]";

  const handGapClass =
    handCount >= 6
      ? "gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5"
      : "gap-1.5 xs:gap-2 sm:gap-3 md:gap-4";

  const renderHand = () => {
    if (isOpponent) {
      return Array.from({ length: hand }).map((_, i) => (
        <div
          key={`opp-card-${i}`}
          className="flex-shrink-0 transition-all duration-300"
        >
          <Card type="back" hidden={true} sizeClassName={handCardSize} />
        </div>
      ));
    }

    return hand.map((cardType, index) => (
      <div
        key={`my-card-${index}`}
        className="flex-shrink-0 transition-all duration-300"
      >
        <Card
          type={cardType}
          sizeClassName={handCardSize}
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

      <div className="flex flex-row items-stretch justify-between min-h-[5.6rem] sm:min-h-[7rem] md:min-h-[8rem] p-2 pr-2 sm:pr-4 bg-desert-light dark:bg-gray-900 rounded border border-desert-dark dark:border-gray-700 w-full transition-colors relative overflow-hidden">
        <div
          className={`flex flex-row items-center justify-start ${handGapClass} flex-grow min-w-0 pr-1 sm:pr-2 overflow-hidden`}
        >
          <AnimatePresence>{renderHand()}</AnimatePresence>

          {!isOpponent && hand.length === 0 && (
            <span className="text-gray-400 dark:text-gray-500 italic text-xs h-16 md:h-24 flex items-center px-2 w-full">
              Mão vazia
            </span>
          )}
        </div>

        {!isOpponent && herdCount > 0 && (
          <div className="ml-1.5 sm:ml-auto pl-2 sm:pl-4 border-l-2 border-dashed border-gray-400 dark:border-gray-600 flex flex-col items-center justify-center transition-colors flex-shrink-0 mr-0.5 sm:mr-1 self-stretch">
            <div className="flex items-center justify-center">
              <Card
                type="camel"
                count={herdCount}
                sizeClassName={herdCardSize}
              />
            </div>

            <div className="mt-1 md:mt-2 flex items-center gap-0.5 md:gap-1 scale-90 sm:scale-100">
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
          <div className="ml-1.5 sm:ml-auto pl-2 sm:pl-4 border-l-2 border-dashed border-gray-400 dark:border-gray-600 flex flex-col items-center justify-center transition-colors flex-shrink-0 mr-0.5 sm:mr-1 self-stretch">
            <div className="flex items-center justify-center">
              <Card
                type="camel"
                count={herdCount > 0 ? "?" : undefined}
                sizeClassName={herdCardSize}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
