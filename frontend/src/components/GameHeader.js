import React from "react";
import {
  FaQuestionCircle,
  FaSignOutAlt,
  FaCircle,
  FaMoon,
  FaSun,
} from "react-icons/fa";

export default function GameHeader({
  opponentConnected,
  onOpenHelp,
  onLeaveRoom,
  isDarkMode,
  toggleTheme,
}) {
  return (
    <div className="bg-jaipur-green dark:bg-green-900 p-2 md:p-3 rounded-xl shadow-md border-2 border-jaipur-gold flex items-center justify-between mb-2 transition-colors">
      <div className="flex items-center">
        <img
          src="/images/logo-horizontal.png"
          alt="Rota dos Camelos"
          className="h-8 md:h-10 object-contain drop-shadow-md"
        />
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 bg-white bg-opacity-95 dark:bg-gray-800 px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-inner"
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
          <span className="text-[10px] md:text-xs font-bold text-gray-800 dark:text-gray-200 hidden sm:block uppercase tracking-wider mt-px">
            {opponentConnected ? "Online" : "Aguardando"}
          </span>
        </div>

        {/* BOTÃO DE TEMA SUPER DESTACADO */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-black bg-opacity-20 dark:bg-white dark:bg-opacity-20 text-white hover:scale-110 transition-transform drop-shadow-md border border-white border-opacity-30"
          title="Alternar Tema"
        >
          {isDarkMode ? (
            <FaSun className="text-lg md:text-xl text-yellow-300" />
          ) : (
            <FaMoon className="text-lg md:text-xl text-white" />
          )}
        </button>

        <button
          onClick={onOpenHelp}
          className="text-white hover:text-jaipur-gold transition-colors text-xl md:text-2xl p-1 drop-shadow-md"
          title="Regras"
        >
          <FaQuestionCircle />
        </button>

        <button
          onClick={onLeaveRoom}
          className="text-white hover:text-red-300 transition-colors text-xl md:text-2xl p-1 drop-shadow-md"
          title="Sair para o Menu"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}
