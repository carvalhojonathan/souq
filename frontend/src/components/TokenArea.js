import React from "react";
import TokenPile from "./TokenPile";

export default function TokenArea({ tokens }) {
  if (!tokens) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-sm border border-jaipur-gold dark:border-gray-700 flex flex-col justify-start h-full transition-colors">
      {/* Grupos de Fichas rigorosamente UM EMBAIXO DO OUTRO */}
      <div className="flex flex-col gap-y-1">
        <TokenPile type="diamond" label="Diamante" data={tokens.diamond} />
        <TokenPile type="gold" label="Ouro" data={tokens.gold} />
        <TokenPile type="silver" label="Prata" data={tokens.silver} />
        <TokenPile type="cloth" label="Tecido" data={tokens.cloth} />
        <TokenPile type="spice" label="Especiaria" data={tokens.spice} />
        <TokenPile type="leather" label="Couro" data={tokens.leather} />
      </div>

      <hr className="border-t border-gray-300 dark:border-gray-600 my-2 w-full transition-colors" />

      {/* Bónus também UM EMBAIXO DO OUTRO */}
      <div className="flex flex-col gap-y-1">
        <TokenPile type="bonus5" label="5 Cartas" data={tokens.bonus5} />
        <TokenPile type="bonus4" label="4 Cartas" data={tokens.bonus4} />
        <TokenPile type="bonus3" label="3 Cartas" data={tokens.bonus3} />
        <TokenPile type="camel" label="Mais camelos" data={tokens.camel} />
      </div>
    </div>
  );
}
