import React, { useState } from "react";

const TokenBadge = ({ value, type, isHidden = false, isCompact = false }) => {
  const [imgError, setImgError] = useState(false);

  const nameMap = {
    diamond: "diamante",
    gold: "ouro",
    silver: "prata",
    cloth: "tecido",
    spice: "especiarias",
    leather: "couro",
    bonus3: "bonus",
    bonus4: "bonus",
    bonus5: "bonus",
    camelToken: "rebanho",
  };

  const imgSrc = nameMap[type] ? `/images/tokens/${nameMap[type]}.png` : null;

  const sizeClasses = isCompact
    ? "w-6 h-6 md:w-8 md:h-8"
    : "w-8 h-8 md:w-10 md:h-10";

  const textSize = isCompact ? "text-[10px] md:text-xs" : "text-xs md:text-sm";
  const badgeTextSize = isCompact
    ? "text-[9px] md:text-[10px]"
    : "text-[10px] md:text-xs";

  return (
    <div className="relative inline-flex flex-col items-center transition-all hover:-translate-y-1 hover:z-20 z-10">
      {imgSrc && !imgError ? (
        <img
          src={imgSrc}
          alt={type}
          onError={() => setImgError(true)}
          className={`${sizeClasses} object-contain p-[1px] drop-shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${textSize} font-bold border border-white/70 dark:border-gray-700`}
        >
          {isHidden ? "?" : value}
        </div>
      )}

      {value !== undefined && !isHidden && (
        <span
          className={`${badgeTextSize} font-bold leading-none text-gray-800 dark:text-gray-200 -mt-1 z-20`}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default function TokenArea({ tokens }) {
  if (!tokens) return null;

  const renderGroup = (type, title) => {
    const group = tokens[type];
    if (group === undefined || group === null) return null;

    const isArray = Array.isArray(group);
    const count = isArray
      ? group.length
      : typeof group === "number"
        ? group
        : 0;

    const isHidden = type.includes("bonus");
    const isCompact = count > 6;

    return (
      <div className="mb-4">
        <h4 className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0">
          {title}
        </h4>

        {count === 0 ? (
          <span className="text-xs italic text-gray-400 pl-1">Esgotado</span>
        ) : (
          <div
            className={`flex flex-row ${
              isCompact ? "flex-nowrap" : "flex-wrap"
            } -space-x-3 md:-space-x-4 pl-1 pt-1 pb-1`}
          >
            {isArray
              ? group.map((t, i) => (
                  <TokenBadge
                    key={i}
                    value={t.value}
                    type={type}
                    isHidden={isHidden}
                    isCompact={isCompact}
                  />
                ))
              : Array.from({ length: count }).map((_, i) => (
                  <TokenBadge
                    key={i}
                    value={isHidden ? "?" : 5}
                    type={type}
                    isHidden={isHidden}
                    isCompact={isCompact}
                  />
                ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-sm border border-jaipur-gold dark:border-gray-700 h-full max-h-full overflow-y-auto custom-scrollbar transition-colors">
      <div className="flex flex-col md:flex-col gap-1">
        <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1">
          <div className="flex flex-col order-1 md:order-2">
            {renderGroup("cloth", "Tecido")}
            {renderGroup("spice", "Especiaria")}
            {renderGroup("leather", "Couro")}
          </div>

          <div className="flex flex-col order-2 md:order-1">
            {renderGroup("diamond", "Diamante")}
            {renderGroup("gold", "Ouro")}
            {renderGroup("silver", "Prata")}
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700 my-1 md:my-2" />

        <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1">
          <div className="flex flex-col">
            {renderGroup("bonus5", "5 Cartas")}
            {renderGroup("bonus4", "4 Cartas")}
          </div>

          <div className="flex flex-col">
            {renderGroup("bonus3", "3 Cartas")}
            {renderGroup("camelToken", "Maior Rebanho")}
          </div>
        </div>
      </div>
    </div>
  );
}
