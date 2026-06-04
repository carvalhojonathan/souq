import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import GameBoard from "./components/GameBoard";

// Detecta automaticamente se está no computador local ou na internet
const socketUrl =
  window.location.hostname === "localhost" ? "http://localhost:3000" : "/"; // Na internet, conecta-se ao próprio domínio

const socket = io(socketUrl);

function App() {
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("jaipur_playerName") || "",
  );
  const [roomId, setRoomId] = useState(
    () => localStorage.getItem("jaipur_roomId") || "",
  );
  const [joinCode, setJoinCode] = useState(
    () => localStorage.getItem("jaipur_joinCode") || "",
  );
  const [inGame, setInGame] = useState(
    () => localStorage.getItem("jaipur_inGame") === "true",
  );
  const [isWaiting, setIsWaiting] = useState(
    () => localStorage.getItem("jaipur_isWaiting") === "true",
  );

  const [gameState, setGameState] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);

  // Modais de UI
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); // Substitui os 'alerts' nativos

  // Sincronização básica com LocalStorage
  useEffect(() => {
    localStorage.setItem("jaipur_playerName", playerName);
    localStorage.setItem("jaipur_roomId", roomId);
    localStorage.setItem("jaipur_joinCode", joinCode);
    localStorage.setItem("jaipur_inGame", inGame);
    localStorage.setItem("jaipur_isWaiting", isWaiting);
  }, [playerName, roomId, joinCode, inGame, isWaiting]);

  // Reconexão automática ao dar F5
  useEffect(() => {
    if ((inGame || isWaiting) && roomId && playerName) {
      socket.emit("joinRoom", { roomId, playerName });
    }
  }, []);

  // Limpa tudo, desliga a partida e zera o LocalStorage
  const resetToLobby = () => {
    setInGame(false);
    setIsWaiting(false);
    setRoomId("");
    setJoinCode("");
    setGameState(null);
    setOpponentConnected(false);
    setShowLeaveModal(false);

    // Forçar limpeza do histórico de reconexão do LocalStorage
    localStorage.removeItem("jaipur_roomId");
    localStorage.removeItem("jaipur_joinCode");
    localStorage.removeItem("jaipur_inGame");
    localStorage.removeItem("jaipur_isWaiting");
  };

  useEffect(() => {
    socket.on("roomCreated", (id) => {
      setRoomId(id);
      setIsWaiting(true);
    });
    socket.on("gameReady", () => {
      setIsWaiting(false);
      setInGame(true);
      setOpponentConnected(true);
    });
    socket.on("updateGameState", (newState) => {
      setGameState(newState);
    });

    // Tratamento de mensagens do Servidor
    socket.on("errorMsg", (msg) => {
      setErrorMsg(msg); // Exibe o pop-up bonito em vez do alert()
      if (
        msg.includes("encerrada") ||
        msg.includes("não encontrada") ||
        msg.includes("cheia")
      ) {
        resetToLobby();
      }
    });

    socket.on("opponentDisconnected", () => {
      setErrorMsg("O oponente saiu da sala ou a sala foi encerrada.");
      resetToLobby();
    });

    return () => {
      socket.off("roomCreated");
      socket.off("gameReady");
      socket.off("updateGameState");
      socket.off("errorMsg");
      socket.off("opponentDisconnected");
    };
  }, []);

  const createRoom = () => {
    if (playerName.trim() === "")
      return setErrorMsg("Por favor, digite o seu nome primeiro.");
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    socket.emit("createRoom", { roomId: randomCode, playerName });
  };

  const joinRoom = () => {
    if (playerName.trim() === "")
      return setErrorMsg("Por favor, digite o seu nome primeiro.");
    if (joinCode.trim() === "")
      return setErrorMsg("Por favor, digite o código da sala.");
    setRoomId(joinCode);
    socket.emit("joinRoom", { roomId: joinCode, playerName });
  };

  // Controlos do Pop-up de Saída
  const requestLeaveRoom = () => setShowLeaveModal(true);
  const cancelLeaveRoom = () => setShowLeaveModal(false);
  const confirmLeaveRoom = () => {
    socket.emit("leaveRoom", roomId);
    resetToLobby();
  };

  return (
    <>
      {/* POP-UP DE MENSAGENS E ERROS (Sala Cheia, Não encontrada, etc) */}
      <AnimatePresence>
        {errorMsg !== "" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full border-t-8 border-jaipur-gold text-center"
            >
              <h3 className="text-2xl font-display font-bold text-gray-800 mb-3">
                ⚠️ Aviso
              </h3>
              <p className="text-gray-600 font-bold mb-8 text-sm">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg("")}
                className="w-full py-3 px-4 bg-jaipur-gold text-white font-bold rounded-lg hover:opacity-90 transition-colors shadow-md"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POP-UP DE CONFIRMAÇÃO DE SAÍDA */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full border-t-8 border-jaipur-red text-center"
            >
              <h3 className="text-2xl font-display font-bold text-gray-800 mb-3">
                Abandonar Partida?
              </h3>
              <p className="text-gray-600 font-bold mb-8 text-sm">
                Tem a certeza que deseja sair da sala? A partida será encerrada
                para o seu oponente também.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelLeaveRoom}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLeaveRoom}
                  className="flex-1 py-3 px-4 bg-jaipur-red text-white font-bold rounded-lg hover:bg-red-800 transition-colors shadow-md"
                >
                  Sair da Sala
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDERIZAÇÃO DO TABULEIRO */}
      {inGame && gameState ? (
        <div className="min-h-screen p-2 md:p-4 font-body text-gray-800">
          <GameBoard
            gameState={gameState}
            socket={socket}
            roomId={roomId}
            opponentConnected={opponentConnected}
            onLeaveRoom={requestLeaveRoom}
          />
        </div>
      ) : isWaiting ? (
        /* RENDERIZAÇÃO DA TELA DE ESPERA (LOBBY) */
        <div className="min-h-screen flex flex-col items-center justify-center p-4 font-body">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl text-center border-t-8 border-jaipur-green relative max-w-md w-full">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={requestLeaveRoom}
              className="absolute top-4 right-4 text-jaipur-red font-bold hover:opacity-80 touch-manipulation p-2 text-sm"
            >
              X Cancelar
            </motion.button>

            {/* LOGO ADICIONADA AO LOBBY */}
            <img
              src="/images/logo.png"
              alt="Rota dos Camelos"
              className="h-28 mx-auto mb-6 object-contain drop-shadow-md"
            />

            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 mb-2 animate-pulse">
              ⏳ Aguardando...
            </h2>
            <p className="text-gray-600 font-bold mb-6 text-sm">
              A sua sala está pronta. Partilhe o código abaixo:
            </p>

            {/* DESIGN DO CÓDIGO MELHORADO */}
            <div className="bg-desert-light py-4 rounded-lg border border-desert-dark mb-2">
              <div className="text-5xl font-display font-bold text-jaipur-green tracking-widest drop-shadow-sm">
                {roomId}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* RENDERIZAÇÃO DO MENU INICIAL */
        <div className="min-h-screen flex flex-col items-center justify-center p-4 font-body">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border-t-8 border-jaipur-green text-center">
            <img
              src="/images/logo.png"
              alt="Rota dos Camelos"
              className="h-48 md:h-64 mx-auto mb-2 object-contain drop-shadow-md"
            />

            {/* FRASE ATUALIZADA */}
            <p className="text-gray-600 mb-8 font-bold">
              O mercado te aguarda!
            </p>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                maxLength="12"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-jaipur-green text-center text-lg font-bold touch-manipulation"
                placeholder="O SEU NOME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={createRoom}
                className="w-full bg-jaipur-green text-white font-bold py-4 px-4 rounded-lg hover:opacity-90 transition-colors shadow-md text-lg touch-manipulation select-none"
              >
                🌟 Criar Nova Sala
              </motion.button>

              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="px-3 text-gray-400 text-sm font-bold">
                  OU ENTRAR NUMA SALA
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength="4"
                  className="w-2/3 px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-jaipur-gold text-center text-xl tracking-widest font-bold touch-manipulation"
                  placeholder="CÓDIGO"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={joinRoom}
                  className="w-1/3 bg-jaipur-gold text-white font-bold py-3 px-2 rounded-lg hover:opacity-90 transition-colors shadow-md text-sm touch-manipulation select-none"
                >
                  Entrar
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
