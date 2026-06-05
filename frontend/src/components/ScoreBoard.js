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
      <div className="flex flex-col items-center bg-white rounded-full p-0.5 shadow-sm">
        <img
          src={imgSrc}
          alt={groupKey}
          onError={() => setImgError(true)}
          className="w-6 h-6 object-contain"
          style={{ imageRendering: "-webkit-optimize-contrast" }}
        />
        {val !== "" && (
          <span className="text-[9px] font-bold mt-[2px] leading-none text-gray-700">
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
    let goodsSum = 0;
    let bonusCount = 0;

    player.tokens.forEach((token) => {
      if (token.type === "good") goodsSum += token.value;
      if (token.type === "bonus") {
        if (isOpponent) bonusCount++;
        else goodsSum += token.value;
      }
    });

    return { goodsSum, bonusCount };
  };

  const myScore = calculatePartial(myPlayer, false);
  const oppScore = calculatePartial(opponent, true);

  const renderMiniTokensGrouped = (tokens, isOpponent) => {
    if (tokens.length === 0)
      return <span className="text-[10px] text-gray-400">Nenhuma ficha</span>;

    const grouped = {};
    tokens.forEach((t) => {
      const key =
        t.type === "bonus"
          ? "bonus"
          : t.type === "camel"
            ? "camel"
            : t.good || t.goodType || t.id || t.name || "good";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    return (
      // Envolve tudo numa coluna para que as categorias fiquem UMA EMBAIXO DA OUTRA
      <div className="flex flex-col gap-1 mt-2">
        {Object.keys(grouped).map((groupKey) => (
          // Dentro da categoria, as fichas ficam LADO A LADO na horizontal
          <div key={groupKey} className="flex flex-row items-center">
            {grouped[groupKey].map((t, i) => {
              const val = t.type === "bonus" && isOpponent ? "" : t.value;
              return (
                <div
                  key={i}
                  className={i > 0 ? "-ml-3" : ""}
                  style={{ zIndex: i }}
                >
                  <MiniTokenBadge val={val} groupKey={groupKey} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-jaipur-gold flex flex-col h-full overflow-y-auto">
      <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2 flex items-center gap-1">
        🏆 Placar Parcial
      </h3>

      <div className="flex flex-col gap-2 mt-1">
        <div className="bg-white p-2 rounded border-2 border-jaipur-green bg-opacity-50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-jaipur-green">
              {myPlayer.name || "Você"}
            </span>
            <div className="flex items-center gap-1 text-sm font-display font-bold text-jaipur-green">
              <FaCoins className="text-jaipur-gold text-xs" />{" "}
              {myScore.goodsSum}
            </div>
          </div>
          {renderMiniTokensGrouped(myPlayer.tokens, false)}
        </div>

        <div className="bg-white p-2 rounded border-2 border-jaipur-red bg-opacity-50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-jaipur-red">
              {opponent.name || "Oponente"}
            </span>
            <div className="flex items-center gap-1 text-sm font-display font-bold text-jaipur-red">
              <FaCoins className="text-jaipur-gold text-xs" />{" "}
              {oppScore.goodsSum}
              {oppScore.bonusCount > 0 && (
                <span className="text-[10px] ml-1 text-jaipur-red">
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
