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

      <div className="flex flex-row items-center justify-between min-h-[7rem] md:min-h-[8rem] p-2 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 w-full transition-colors relative overflow-hidden">
        {/* BARALHO (DECK) */}
        <div className="flex flex-col items-center flex-shrink-0 w-[45px] sm:w-[70px] md:w-[85px]">
          <Card type="deck" count={deckCount} />
        </div>

        {/* CARTAS DO MERCADO CENTRAL */}
        <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 flex-grow min-w-0 px-1 sm:px-2 border-l border-r border-dashed border-gray-300 dark:border-gray-700 mx-1 sm:mx-2">
          {marketCards.map((cardType, index) => (
            <div
              key={`market-card-${index}`}
              className="flex-shrink min-w-[35px] w-[55px] sm:w-[75px] md:w-[90px] transition-all duration-300"
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

        {/* PILHA DE DESCARTE (Oculta em telemóveis: hidden sm:flex) */}
        <div className="hidden sm:flex flex-col items-center flex-shrink-0 w-[55px] sm:w-[70px] md:w-[85px]">
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
