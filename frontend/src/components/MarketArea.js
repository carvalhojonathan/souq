import React from "react";
import Card from "./Card";

export default function MarketArea({
  isMyTurn,
  marketCards,
  deckCount,
  discardPile,
  selectedMarketCards,
  onSelectCard,
  className = "",
}) {
  return (
    <div
      className={`p-2 rounded-lg shadow-sm border-2 border-jaipur-gold dark:border-yellow-700/50 bg-desert-light dark:bg-gray-800 flex flex-col min-w-0 ${className}`}
    >
      <h2 className="font-display font-bold text-sm text-jaipur-gold dark:text-yellow-500 mb-2 px-2 uppercase tracking-widest text-center">
        Mercado
      </h2>

      <div className="flex flex-row items-center justify-between min-h-[7rem] md:min-h-[8rem] p-2 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 w-full transition-colors relative overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="flex flex-col items-center flex-shrink-0 w-[50px] max-w-[50px] sm:w-[70px] sm:max-w-[70px] md:w-[85px] md:max-w-[85px] ml-1 sm:ml-3">
          <Card type="deck" count={deckCount} />
        </div>

        <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 md:gap-4 flex-grow min-w-max px-2 sm:px-3 border-l border-r border-dashed border-gray-300 dark:border-gray-700 mx-2 sm:mx-4">
          {marketCards.map((cardType, index) => (
            <div
              key={`market-card-${index}`}
              className="flex-shrink-0 w-[60px] max-w-[60px] sm:w-[75px] sm:max-w-[75px] md:w-[90px] md:max-w-[90px] transition-all duration-300"
            >
              <Card
                type={cardType}
                isSelected={selectedMarketCards.includes(index)}
                onClick={() => {
                  if (isMyTurn) onSelectCard(index);
                }}
              />
            </div>
          ))}
        </div>

        <div className="hidden sm:flex flex-col items-center flex-shrink-0 w-[50px] max-w-[50px] sm:w-[70px] sm:max-w-[70px] md:w-[85px] md:max-w-[85px] mr-1 sm:mr-2 opacity-75 blur-[2px] hover:blur-none hover:opacity-100 transition-all duration-300 cursor-default">
          {discardPile && discardPile.length > 0 ? (
            <Card type={discardPile[discardPile.length - 1]} />
          ) : (
            <div className="w-full h-full aspect-[2/3] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">
              Vazio
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
