import React, { useState } from "react";
import { FaCoins } from "react-icons/fa";

const MiniTokenBadge = ({ val, groupKey }) => {
  const [imgError, setImgError] = useState(false);

  const tokenToName = {
    diamond: "diamante",
    gold: "ouro",
    silver: "prata",
    cloth: "tecido",
    spice: "especiarias",
    leather: "couro",
    camel: "rebanho",
    bonus: "bonus",
  };

  const tokenColors = {
    diamond: "bg-blue-500 text-white border-blue-600",
    gold: "bg-yellow-500 text-white border-yellow-600",
    silver: "bg-white text-gray-800 border-gray-300",
    cloth: "bg-pink-500 text-white border-pink-600",
    spice: "bg-red-500 text-white border-red-600",
    leather: "bg-[#8B4513] text-white border-[#5C2E0B]",
    bonus: "bg-green-600 text-white border-green-700",
    camel: "bg-yellow-700 text-white border-yellow-800",
    good: "bg-gray-400 text-white border-gray-500",
  };

  const imgSrc = tokenToName[groupKey]
    ? `/images/tokens/${tokenToName[groupKey]}.png`
    : null;
  const colorClass = tokenColors[groupKey] || tokenColors.good;

  if (imgSrc && !imgError) {
    return (
      <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-full p-0.5 shadow-sm transition-colors">
        <img
          src={imgSrc}
          alt={groupKey}
          onError={() => setImgError(true)}
          className="w-6 h-6 object-contain"
          style={{ imageRendering: "-webkit-optimize-contrast" }}
        />
        {val !== "" && (
          <span className="text-[9px] font-bold mt-[2px] leading-none text-gray-700 dark:text-gray-200 transition-colors">
            {val}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-6 h-6 text-[10px] flex items-center justify-center rounded-full border shadow-sm font-bold ${colorClass}`}
      title={groupKey}
    >
      {val !== "" ? val : ""}
    </div>
  );
};

export default function ScoreBoard({ myPlayer, opponent }) {
  const calculatePartial = (player, isOpponent) => {
    let visibleSum = 0;
    let secretSum = 0;
    let secretCount = 0;

    player.tokens.forEach((token) => {
      if (token.type === "good") {
        visibleSum += token.value;
      }
      if (token.type === "bonus") {
        if (isOpponent) {
          secretCount++;
        } else {
          secretSum += token.value;
        }
      }
    });

    return {
      visibleSum,
      secretSum,
      secretCount,
      totalSum: visibleSum + secretSum,
    };
  };

  const myScore = calculatePartial(myPlayer, false);
  const oppScore = calculatePartial(opponent, true);

  const renderMiniTokensGrouped = (tokens, isOpponent) => {
    // FILTRO: Pega APENAS as fichas que são do tipo bónus
    const bonusTokens = tokens.filter(
      (t) =>
        t.type === "bonus" || t.id?.includes("bonus") || t.name === "bonus",
    );

    if (bonusTokens.length === 0)
      return (
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Nenhum bônus
        </span>
      );

    const chunkArray = (arr, size) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    // Quebra o array em blocos de no máximo 3 fichas por linha
    const chunks = chunkArray(bonusTokens, 3);

    return (
      <div className="flex flex-col gap-1 mt-2">
        {chunks.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="flex flex-row items-center gap-1">
            {chunk.map((t, i) => {
              // Se for oponente, esconde o valor da ficha de bónus
              const val = isOpponent ? "" : t.value;
              return (
                <div key={i}>
                  <MiniTokenBadge val={val} groupKey="bonus" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-jaipur-gold dark:border-gray-700 flex flex-col h-full overflow-y-auto transition-colors">
      <h3 className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest border-b border-gray-300 dark:border-gray-600 pb-1 mb-2 flex items-center gap-1 transition-colors">
        🏆 Placar Parcial
      </h3>

      <div className="flex flex-col gap-2 mt-1">
        <div className="bg-white dark:bg-gray-800 p-2 rounded border-2 border-jaipur-green dark:border-green-600/50 bg-opacity-50 dark:bg-opacity-100 transition-colors">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-jaipur-green dark:text-green-400">
              {myPlayer.name || "Você"}
            </span>
            <div className="flex items-center gap-1 text-sm font-display font-bold text-jaipur-green dark:text-green-400">
              <FaCoins className="text-jaipur-gold text-xs" />
              <span>{myScore.totalSum}</span>
              <span
                className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1 transition-colors"
                title="Pontos visíveis para o oponente"
              >
                ({myScore.visibleSum})
              </span>
            </div>
          </div>
          {renderMiniTokensGrouped(myPlayer.tokens, false)}
        </div>

        <div className="bg-white dark:bg-gray-800 p-2 rounded border-2 border-jaipur-red dark:border-red-600/50 bg-opacity-50 dark:bg-opacity-100 transition-colors">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-jaipur-red dark:text-red-400">
              {opponent.name || "Oponente"}
            </span>
            <div className="flex items-center gap-1 text-sm font-display font-bold text-jaipur-red dark:text-red-400">
              <FaCoins className="text-jaipur-gold text-xs" />{" "}
              {oppScore.visibleSum}
              {oppScore.secretCount > 0 && (
                <span className="text-[10px] ml-1 text-jaipur-red dark:text-red-400">
                  (+ bônus)
                </span>
              )}
            </div>
          </div>
          {renderMiniTokensGrouped(opponent.tokens, true)}
        </div>
      </div>
    </div>
  );
}
