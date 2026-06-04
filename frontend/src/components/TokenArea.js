import React from "react";
import TokenPile from "./TokenPile";

export default function TokenArea({ tokens }) {
  if (!tokens) return null;

  return (
    <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-jaipur-gold flex flex-col justify-center h-full">
      {/* LINHA 1: Mercadorias Normais */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-start items-center">
        <TokenPile type="diamond" label="Diamante" data={tokens.diamond} />
        <TokenPile type="gold" label="Ouro" data={tokens.gold} />
        <TokenPile type="silver" label="Prata" data={tokens.silver} />
        <TokenPile type="cloth" label="Tecido" data={tokens.cloth} />
        <TokenPile type="spice" label="Especiaria" data={tokens.spice} />
        <TokenPile type="leather" label="Couro" data={tokens.leather} />
      </div>

      {/* LINHA HORIZONTAL DIVISÓRIA */}
      <hr className="border-t border-gray-300 my-1 md:my-2 w-full" />

      {/* LINHA 2: Bónus e Camelo */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-start items-center">
        <TokenPile type="bonus5" label="5 Cartas" data={tokens.bonus5} />
        <TokenPile type="bonus4" label="4 Cartas" data={tokens.bonus4} />
        <TokenPile type="bonus3" label="3 Cartas" data={tokens.bonus3} />
        <TokenPile type="camel" label="Mais camelos" data={tokens.camel} />
      </div>
    </div>
  );
}
