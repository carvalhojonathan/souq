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
  selectedHandCards = [],
  onSelectCard,
  selectedHerdCount = 0,
  onHerdSelect,
  isMyTurn = false,
  className = "",
}) {
  const renderHand = () => {
    if (isOpponent) {
      return Array.from({ length: hand }).map((_, i) => (
        <div key={`opp-card-${i}`}>
          <Card type="back" hidden={true} />
        </div>
      ));
    } else {
      return hand.map((cardType, index) => (
        <div key={`my-card-${index}`} className="transition-all duration-300">
          <Card
            type={cardType}
            isSelected={selectedHandCards.includes(index)}
            onClick={() => {
              if (isMyTurn) onSelectCard(index);
            }}
          />
        </div>
      ));
    }
  };

  const areaStyle = isOpponent
    ? "bg-gray-50 dark:bg-gray-800 border-jaipur-red dark:border-red-900/50"
    : "bg-white dark:bg-gray-800 border-jaipur-green dark:border-green-900/50";

  return (
    <div
      className={`p-2 rounded-lg shadow-sm border-2 transition-colors ${areaStyle} ${className}`}
    >
      <div className="flex justify-between items-center mb-2 px-2">
        <h2
          className={`font-display font-bold text-sm ${isOpponent ? "text-jaipur-red dark:text-red-400" : "text-jaipur-green dark:text-green-400"}`}
        >
          {isOpponent
            ? `👤 ${playerName || "Oponente"}`
            : `🐫 ${playerName || "A Sua Mão"}`}
        </h2>
        <div className="flex gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <FaAward
              key={i}
              className={`text-lg transition-colors ${i < seals ? "text-jaipur-gold drop-shadow-sm" : "text-gray-300 dark:text-gray-600"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-start min-h-[8rem] p-2 bg-desert-light dark:bg-gray-900 rounded border border-desert-dark dark:border-gray-700 overflow-x-auto w-full transition-colors">
        <div className="flex px-2 items-center w-full min-w-max">
          <div className="flex gap-2">
            <AnimatePresence>{renderHand()}</AnimatePresence>
            {!isOpponent && hand.length === 0 && (
              <span className="text-gray-400 dark:text-gray-500 italic text-xs h-24 flex items-center">
                Mão vazia
              </span>
            )}
          </div>

          {!isOpponent && herdCount > 0 && (
            <div className="ml-auto pl-6 border-l border-dashed border-gray-400 dark:border-gray-600 flex flex-col items-center transition-colors">
              <Card type="camel" count={herdCount} />

              <div className="mt-2 flex items-center gap-1">
                {/* Botão "X" movido para o lado esquerdo */}
                <button
                  onClick={() => onHerdSelect(0)}
                  disabled={selectedHerdCount === 0}
                  className={`bg-jaipur-red dark:bg-red-700 text-white rounded-full p-1 shadow-sm transition-colors touch-none ${selectedHerdCount === 0 ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                  title="Limpar Camelos"
                >
                  <FaTimes size={10} />
                </button>

                <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-300 dark:border-gray-600 text-[10px] transition-colors">
                  <button
                    onClick={() =>
                      onHerdSelect(Math.max(0, selectedHerdCount - 1))
                    }
                    className={`px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white font-bold rounded-l-full touch-none transition-colors ${!isMyTurn || selectedHerdCount === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300 dark:hover:bg-gray-600"}`}
                    disabled={!isMyTurn || selectedHerdCount === 0}
                  >
                    -
                  </button>
                  <span className="px-2 font-bold dark:text-white transition-colors">
                    {selectedHerdCount}
                  </span>
                  <button
                    onClick={() =>
                      onHerdSelect(Math.min(herdCount, selectedHerdCount + 1))
                    }
                    className={`px-2 py-1 bg-jaipur-green dark:bg-green-700 text-white font-bold rounded-r-full touch-none transition-colors ${!isMyTurn || selectedHerdCount === herdCount ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                    disabled={!isMyTurn || selectedHerdCount === herdCount}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {isOpponent && herdCount > 0 && (
            <div className="ml-auto pl-6 border-l border-dashed border-gray-400 dark:border-gray-600 transition-colors">
              <Card type="camel" count={herdCount > 0 ? "?" : undefined} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
