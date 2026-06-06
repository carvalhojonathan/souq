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
  const topDiscard =
    discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div
      // AQUI: dark:bg-gray-800 e dark:border-gray-700
      className={`bg-desert-base dark:bg-gray-800 p-3 rounded-lg shadow-inner border border-desert-dark dark:border-gray-700 flex flex-col items-center transition-colors ${className}`}
    >
      <h2 className="font-display font-bold text-sm text-gray-800 dark:text-gray-300 mb-3 tracking-widest uppercase">
        Mercado
      </h2>

      <div className="flex flex-row gap-4 items-center w-full justify-center">
        {/* Baralho */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {deckCount > 0 ? (
              <>
                {deckCount > 5 && (
                  <div className="absolute top-1 left-1">
                    <Card type="back" hidden={true} />
                  </div>
                )}
                <div className="relative z-10">
                  <Card type="back" hidden={true} count={deckCount} />
                </div>
              </>
            ) : (
              <div className="w-[76px] h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px] border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-50 text-gray-400 dark:text-gray-400 text-[10px]">
                Esgotado
              </div>
            )}
          </div>
        </div>

        {/* Mercado Central */}
        <div className="flex gap-1 p-2 bg-white dark:bg-gray-700 bg-opacity-40 dark:bg-opacity-50 rounded shadow-sm border border-white dark:border-gray-600 border-opacity-50">
          {marketCards.map((cardType, index) => (
            <Card
              key={`market-card-${index}`}
              type={cardType}
              isSelected={selectedMarketCards.includes(index)}
              onClick={() => {
                if (isMyTurn) onSelectCard(index);
              }}
            />
          ))}
          {Array.from({ length: 5 - marketCards.length }).map((_, index) => (
            <div
              key={`empty-market-${index}`}
              className="w-[76px] h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px] border border-dashed border-gray-400 dark:border-gray-600 rounded bg-transparent"
            ></div>
          ))}
        </div>

        {/* Descarte */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {topDiscard ? (
              <Card
                type={topDiscard}
                isDiscard={true}
                count={discardPile.length}
              />
            ) : (
              <div className="w-[76px] h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px] border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-50 text-gray-400 dark:text-gray-400 text-[10px]">
                Vazio
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
