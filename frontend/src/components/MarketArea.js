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
      className={`bg-desert-base p-3 rounded-lg shadow-inner border border-desert-dark flex flex-col items-center ${className}`}
    >
      <h2 className="font-display font-bold text-sm text-gray-800 mb-3 tracking-widest uppercase">
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
              <div className="w-[76px] h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px] border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-200 bg-opacity-50 text-gray-400 text-[10px]">
                Esgotado
              </div>
            )}
          </div>
        </div>

        {/* Mercado Central */}
        <div className="flex gap-1 p-2 bg-white bg-opacity-40 rounded shadow-sm border border-white border-opacity-50">
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
              className="w-[76px] h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px] border border-dashed border-gray-400 rounded bg-transparent"
            ></div>
          ))}
        </div>

        {/* Descarte */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {topDiscard ? (
              // Nova regra ativada (isDiscard={true}) para deixar em p/b, borrado e com contador no centro
              <Card
                type={topDiscard}
                isDiscard={true}
                count={discardPile.length}
              />
            ) : (
              <div className="w-[76px] h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px] border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-200 bg-opacity-50 text-gray-400 text-[10px]">
                Vazio
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
