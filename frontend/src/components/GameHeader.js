import React, { useState } from "react";
import {
  FaCopy,
  FaQuestionCircle,
  FaSignOutAlt,
  FaCheck,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function GameHeader({
  roomId,
  opponentConnected,
  onOpenHelp,
  onLeaveRoom,
}) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 16, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-0 left-1/2 bg-jaipur-gold text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 font-bold tracking-wider text-sm border-2 border-yellow-600"
          >
            <FaCheck /> Código copiado!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-jaipur-green text-white px-4 h-16 md:h-20 rounded-lg shadow-sm mb-1 overflow-hidden relative">
        <div className="flex items-center h-full">
          {/* Aumentado o py-1.5 para py-2.5, o que empurra a imagem mais para dentro e a diminui suavemente */}
          <img
            src="/images/logo-horizontal.png"
            alt="Rota dos Camelos"
            className="h-full py-2.5 hidden md:block drop-shadow-sm object-contain"
          />

          <div className="flex items-center bg-black bg-opacity-20 px-2 py-1.5 rounded border border-white border-opacity-20 ml-2 md:ml-6 z-10">
            <span className="mr-2 text-xs text-gray-200">
              Sala:{" "}
              <strong className="text-white text-sm md:text-base tracking-widest">
                {roomId}
              </strong>
            </span>
            <button
              onClick={copyRoomId}
              className="text-gray-300 hover:text-white transition-colors touch-none"
              title="Copiar código"
            >
              <FaCopy />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10">
          <button
            onClick={onOpenHelp}
            className="text-gray-300 hover:text-jaipur-gold transition-colors touch-none"
            title="Ver Regras"
          >
            <FaQuestionCircle size={20} />
          </button>

          <div className="text-xs md:text-sm hidden sm:block">
            {opponentConnected ? (
              <span className="text-green-300 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>{" "}
                Conectado
              </span>
            ) : (
              <span className="text-red-300 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>{" "}
                Desconectado
              </span>
            )}
          </div>

          <button
            onClick={onLeaveRoom}
            className="text-white hover:opacity-80 transition-opacity flex items-center gap-1 text-xs md:text-sm font-bold bg-jaipur-red px-3 py-1.5 rounded shadow-sm touch-none"
            title="Sair da Sala"
          >
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </div>
    </>
  );
}
