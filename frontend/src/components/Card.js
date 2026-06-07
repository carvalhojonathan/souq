import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  GiCamel,
  GiCutDiamond,
  GiGoldBar,
  GiRolledCloth,
  GiAnimalHide,
} from "react-icons/gi";
import { FaCoins, FaPepperHot } from "react-icons/fa";

const getIcon = (type, className) => {
  const icons = {
    camel: <GiCamel className={className} />,
    diamond: <GiCutDiamond className={className} />,
    gold: <GiGoldBar className={className} />,
    silver: <FaCoins className={className} />,
    cloth: <GiRolledCloth className={className} />,
    spice: <FaPepperHot className={className} />,
    leather: <GiAnimalHide className={className} />,
    back: <span className={className}>🕌</span>,
  };

  return icons[type] || icons.back;
};

export default function Card({
  type,
  hidden = false,
  count,
  isSelected = false,
  onClick,
  isDiscard = false,
  sizeClassName = "",
}) {
  const [imgError, setImgError] = useState(false);

  const typeToName = {
    diamond: "diamante",
    gold: "ouro",
    silver: "prata",
    cloth: "tecido",
    spice: "especiarias",
    leather: "couro",
    camel: "camelo",
    back: "verso",
    deck: "verso",
  };

  const imgName = hidden ? "verso" : typeToName[type] || "verso";
  const imgSrc = `/images/cards/${imgName}.png`;

  const typeColors = {
    diamond: "bg-cyan-100 text-cyan-900 border-cyan-400",
    gold: "bg-yellow-400 text-yellow-900 border-yellow-600",
    silver: "bg-gray-200 text-gray-800 border-gray-400",
    cloth: "bg-pink-600 text-white border-pink-800",
    spice: "bg-orange-600 text-white border-orange-800",
    leather: "bg-amber-800 text-white border-amber-950",
    camel: "bg-yellow-200 text-yellow-900 border-yellow-600",
    back: "bg-jaipur-green text-jaipur-gold border-jaipur-gold",
    deck: "bg-jaipur-green text-jaipur-gold border-jaipur-gold",
  };

  const labels = {
    diamond: "Diamante",
    gold: "Ouro",
    silver: "Prata",
    cloth: "Tecido",
    spice: "Especiaria",
    leather: "Couro",
    camel: "Camelo",
    back: "Jaipur",
    deck: "Jaipur",
  };

  const fallbackStyle = hidden
    ? typeColors.back
    : typeColors[type] || typeColors.back;

  const fallbackLabel = hidden ? labels.back : labels[type] || labels.back;

  const cardSizeClass =
    sizeClassName ||
    "w-[58px] h-[76px] sm:w-[76px] sm:h-[100px] md:w-[90px] md:h-[117px] lg:w-[100px] lg:h-[130px]";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      onClick={onClick}
      className={`
        relative flex flex-col justify-center items-center
        rounded-lg cursor-pointer select-none font-body
        transition-shadow duration-200 touch-none border-2
        ${cardSizeClass}
        ${isSelected ? "shadow-xl" : "shadow-md"}
        ${imgError ? fallbackStyle : "border-transparent"}
      `}
    >
      {!imgError ? (
        <img
          src={imgSrc}
          alt={imgName}
          onError={() => setImgError(true)}
          className={`w-full h-full object-contain rounded-lg ${
            isDiscard ? "grayscale blur-[2px]" : ""
          }`}
          style={{
            imageRendering: "-webkit-optimize-contrast",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        />
      ) : (
        <div
          className={`w-[85%] h-[90%] border border-opacity-30 border-current flex flex-col items-center justify-center rounded pointer-events-none ${
            isDiscard ? "grayscale blur-[1px]" : ""
          }`}
        >
          <span className="font-bold text-[8px] md:text-[10px] uppercase text-center px-1 font-display tracking-wider mb-1 md:mb-2 leading-none">
            {fallbackLabel}
          </span>

          {!hidden &&
            getIcon(type, "text-2xl md:text-3xl opacity-90 drop-shadow-sm")}

          {hidden && getIcon("back", "text-2xl md:text-3xl drop-shadow-md")}
        </div>
      )}

      {isSelected && (
        <div className="absolute inset-0 z-30 rounded-lg border-[4px] border-lime-300 pointer-events-none shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_0_10px_rgba(0,128,128,0.45)]" />
      )}

      {isDiscard && count !== undefined && (
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-display font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-40 pointer-events-none">
          {count}
        </span>
      )}

      {!isDiscard && count !== undefined && (
        <span className="absolute bottom-1 right-1 text-xs font-bold bg-black bg-opacity-60 px-2 py-1 rounded-full text-white z-40 pointer-events-none">
          {count}
        </span>
      )}
    </motion.div>
  );
}
