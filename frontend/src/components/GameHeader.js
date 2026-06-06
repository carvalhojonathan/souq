import React from "react";
import { FaQuestionCircle, FaSignOutAlt, FaCircle } from "react-icons/fa";

export default function GameHeader({
  opponentConnected,
  onOpenHelp,
  onLeaveRoom,
}) {
  return (
    <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border border-jaipur-gold flex items-center justify-between mb-2">
      {/* 1. LOGO: Agora sempre visível em qualquer tamanho de ecrã */}
      <div className="flex items-center">
        <img
          src="/images/logo.png"
          alt="Rota dos Camelos"
          className="h-8 md:h-10 object-contain drop-shadow-sm"
        />
      </div>

      {/* 2. STATUS E BOTÕES (Número da sala removido) */}
      <div className="flex items-center gap-3">
        {/* Status de Conexão do Oponente */}
        <div
          className="flex items-center gap-1.5 bg-gray-100 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-gray-200 shadow-inner"
          title={
            opponentConnected ? "Oponente conectado" : "Oponente desconectado"
          }
        >
          <FaCircle
            className={`text-[10px] md:text-xs ${
              opponentConnected
                ? "text-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                : "text-red-500 animate-pulse"
            } rounded-full`}
          />
          <span className="text-[10px] md:text-xs font-bold text-gray-600 hidden sm:block uppercase tracking-wider mt-px">
            {opponentConnected ? "Online" : "Aguardando"}
          </span>
        </div>

        {/* Botão de Regras */}
        <button
          onClick={onOpenHelp}
          className="text-gray-400 hover:text-jaipur-gold transition-colors text-xl md:text-2xl p-1"
          title="Regras"
        >
          <FaQuestionCircle />
        </button>

        {/* Botão de Sair */}
        <button
          onClick={onLeaveRoom}
          className="text-gray-400 hover:text-jaipur-red transition-colors text-xl md:text-2xl p-1"
          title="Sair para o Menu"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}
