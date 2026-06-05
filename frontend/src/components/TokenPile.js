import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GiCutDiamond,
  GiGoldBar,
  GiRolledCloth,
  GiAnimalHide,
  GiCamel,
} from "react-icons/gi";
import { FaCoins, FaPepperHot, FaQuestionCircle } from "react-icons/fa";

const getTokenIcon = (type) => {
  const sizeClass = "text-xl drop-shadow-md";
  const icons = {
    diamond: <GiCutDiamond className={sizeClass} />,
    gold: <GiGoldBar className={sizeClass} />,
    silver: <FaCoins className={sizeClass} />,
    cloth: <GiRolledCloth className={sizeClass} />,
    spice: <FaPepperHot className={sizeClass} />,
    leather: <GiAnimalHide className={sizeClass} />,
    bonus3: <FaQuestionCircle className={sizeClass} />,
    bonus4: <FaQuestionCircle className={sizeClass} />,
    bonus5: <FaQuestionCircle className={sizeClass} />,
    camel: <GiCamel className={sizeClass} />,
  };
  return icons[type] || <FaQuestionCircle className={sizeClass} />;
};

export default function TokenPile({ type, label, data }) {
  const [imgError, setImgError] = useState(false);
  const isArray = Array.isArray(data);

  let count = 0;
  if (isArray) {
    count = data.length;
  } else if (type === "camel") {
    count = 1;
  } else {
    count = typeof data === "number" ? data : data ? 1 : 0;
  }

  const tokenToName = {
    diamond: "diamante",
    gold: "ouro",
    silver: "prata",
    cloth: "tecido",
    spice: "especiarias",
    leather: "couro",
    camel: "rebanho",
    bonus3: "bonus",
    bonus4: "bonus",
    bonus5: "bonus",
  };
  const imgSrc = tokenToName[type]
    ? `/images/tokens/${tokenToName[type]}.png`
    : null;

  const bgColors = {
    diamond: "bg-cyan-100 border-cyan-400 text-cyan-900",
    gold: "bg-yellow-400 border-yellow-600 text-yellow-900",
    silver: "bg-gray-200 border-gray-400 text-gray-800",
    cloth: "bg-pink-600 border-pink-800 text-white",
    spice: "bg-orange-600 border-orange-800 text-white",
    leather: "bg-amber-800 border-amber-950 text-white",
    bonus3: "bg-jaipur-green border-green-900 text-white",
    bonus4: "bg-jaipur-green border-green-900 text-white",
    bonus5: "bg-jaipur-green border-green-900 text-white",
    camel: "bg-jaipur-gold border-yellow-700 text-yellow-900",
  };
  const currentBg = bgColors[type] || "bg-gray-300 border-gray-500 text-black";

  const tooltipText =
    count > 0
      ? isArray
        ? `Valores restantes: ${data.map((d) => d.value).join(", ")}`
        : type === "camel"
          ? `Vale 5 pontos no final`
          : `${count} fichas restantes`
      : "Pilha esgotada";

  const renderStack = () => {
    if (count === 0) {
      return (
        <span className="text-gray-400 italic text-sm font-bold bg-gray-200 px-3 py-1 rounded-full">
          Esgotado
        </span>
      );
    }

    const stackItems = Array.from({ length: count });

    return (
      <AnimatePresence>
        {stackItems.map((_, index) => {
          let displayValue = "";
          if (type === "camel") displayValue = "5";
          else if (isArray) displayValue = data[index].value;

          return (
            <motion.div
              key={count - index}
              layout
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                x: -50,
                scale: 0.5,
                transition: { duration: 0.4 },
              }}
              className="flex flex-col items-center"
              // Fichas individuais espalhadas LADO A LADO na horizontal
              style={{
                marginLeft: index === 0 ? "0" : "-8px",
                zIndex: count - index,
              }}
            >
              {imgSrc && !imgError ? (
                <img
                  src={imgSrc}
                  alt={label}
                  onError={() => setImgError(true)}
                  className="w-10 h-10 object-contain drop-shadow-md"
                  style={{
                    imageRendering: "-webkit-optimize-contrast",
                    transform: "translateZ(0)",
                  }}
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex justify-center items-center font-bold border-2 shadow-md ${currentBg}`}
                >
                  {getTokenIcon(type)}
                </div>
              )}

              {displayValue !== "" && displayValue !== undefined && (
                <span className="text-[10px] font-bold text-gray-800 mt-1 bg-white bg-opacity-70 px-1 rounded shadow-sm">
                  {displayValue}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    );
  };

  return (
    <div
      title={tooltipText}
      className="flex flex-col items-start my-1 cursor-help group w-full"
    >
      <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-left">
        {label}
      </span>
      <div className="flex flex-row items-center justify-start">
        {renderStack()}
      </div>
    </div>
  );
}
