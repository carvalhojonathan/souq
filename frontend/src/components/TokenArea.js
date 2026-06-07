import React, { useState } from "react";

const TokenBadge = ({ value, type, isHidden = false }) => {
  const [imgError, setImgError] = useState(false);
  
  const nameMap = {
    diamond: "diamante", gold: "ouro", silver: "prata",
    cloth: "tecido", spice: "especiarias", leather: "couro",
    bonus3: "bonus", bonus4: "bonus", bonus5: "bonus", camelToken: "rebanho"
  };
  const imgSrc = nameMap[type] ? `/images/tokens/${nameMap[type]}.png` : null;

  return (
    <div className="flex flex-col items-center bg-white dark:bg-gray-700 rounded-full shadow-sm transition-colors">
       {imgSrc && !imgError ? (
          <img src={imgSrc} alt={type} onError={() => setImgError(true)} className="w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow-sm" />
       ) : (
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-300 dark:bg-gray-600 border border-gray-400 flex items-center justify-center text-[10px] md:text-xs font-bold">
             {isHidden ? "?" : value}
          </div>
       )}
       {value !== undefined && !isHidden && (
         <span className="text-[9px] md:text-[11px] font-bold mt-[1px] leading-none text-gray-700 dark:text-gray-200">
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
     
     // Verifica se é array (mercadorias visíveis) ou número (fichas secretas do servidor)
     const isArray = Array.isArray(group);
     const count = isArray ? group.length : (typeof group === "number" ? group : 0);
     const isHidden = type.includes('bonus');
     
     return (
       <div className="mb-2 md:mb-3">
         <h4 className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{title}</h4>
         {count === 0 ? (
            <span className="text-xs italic text-gray-400">Esgotado</span>
         ) : (
            {/* AQUI ESTÁ A MÁGICA: Reduzimos o 'gap' para as fichas ficarem bem mais próximas */}
            <div className="flex flex-wrap gap-0.5 md:gap-1">
               {isArray 
                  ? group.map((t, i) => <TokenBadge key={i} value={t.value} type={type} isHidden={isHidden} />)
                  : Array.from({ length: count }).map((_, i) => <TokenBadge key={i} value={isHidden ? "?" : 5} type={type} isHidden={isHidden} />)
               }
            </div>
         )}
       </div>
     );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-sm border border-jaipur-gold dark:border-gray-700 h-full max-h-full overflow-y-auto custom-scrollbar transition-colors">
       <h3 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest border-b border-gray-300 dark:border-gray-600 pb-2 mb-3">
         💰 Fichas do Mercado
       </h3>
       <div className="flex flex-col md:flex-col gap-2">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2">
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
          <hr className="border-gray-200 dark:border-gray-700 my-2" />
          <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2">
             <div className="flex flex-col order-1 md:order-2">
                {renderGroup("bonus3", "3 Cartas")}
                {renderGroup("camelToken", "Maior Rebanho")}
             </div>
             <div className="flex flex-col order-2 md:order-1">
                {renderGroup("bonus5", "5 Cartas")}
                {renderGroup("bonus4", "4 Cartas")}
             </div>
          </div>
       </div>
    </div>
  );
}