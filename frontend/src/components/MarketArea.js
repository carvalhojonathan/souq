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
  const marketCardSize =
    "w-[54px] h-[71px] sm:w-[76px] sm:h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px]";

  const sidePileSize =
    "w-[50px] h-[66px] sm:w-[66px] sm:h-[86px] md:w-[78px] md:h-[102px] lg:w-[86px] lg:h-[112px]";

  return (
    <div
      className={`p-2 rounded-lg shadow-sm border-2 border-jaipur-gold dark:border-yellow-700/50 bg-desert-light dark:bg-gray-800 flex flex-col min-w-0 ${className}`}
    >
      <h2 className="font-display font-bold text-sm text-jaipur-gold dark:text-yellow-500 mb-2 px-2 uppercase tracking-widest text-center">
        Mercado
      </h2>

      <div className="flex flex-row items-center justify-between min-h-[6.2rem] sm:min-h-[7.5rem] md:min-h-[8.5rem] p-2 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 w-full transition-colors relative overflow-hidden">
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-[52px] sm:w-[68px] md:w-[80px] lg:w-[88px] ml-0.5 sm:ml-2">
          <Card type="deck" count={deckCount} sizeClassName={sidePileSize} />
        </div>

        <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-4 flex-grow min-w-0 px-2 sm:px-3 border-l border-r border-dashed border-gray-300 dark:border-gray-700 mx-2 sm:mx-3 overflow-hidden">
          {marketCards.map((cardType, index) => (
            <div
              key={`market-card-${index}`}
              className="flex-shrink-0 transition-all duration-300"
            >
              <Card
                type={cardType}
                sizeClassName={marketCardSize}
                isSelected={selectedMarketCards.includes(index)}
                onClick={() => {
                  if (isMyTurn) onSelectCard(index);
                }}
              />
            </div>
          ))}
        </div>

        <div className="hidden sm:flex flex-col items-center justify-center flex-shrink-0 w-[68px] md:w-[80px] lg:w-[88px] mr-1 sm:mr-2 opacity-75 blur-[2px] hover:blur-none hover:opacity-100 transition-all duration-300 cursor-default">
          {discardPile && discardPile.length > 0 ? (
            <Card
              type={discardPile[discardPile.length - 1]}
              sizeClassName={sidePileSize}
            />
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
