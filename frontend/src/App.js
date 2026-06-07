import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import GameBoard from "./components/GameBoard";
import { FaMoon, FaSun, FaRobot, FaUserFriends } from "react-icons/fa";

const socketUrl =
  window.location.hostname === "localhost" ? "http://localhost:3000" : "/";

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

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("jaipur_theme") === "dark",
  );

  const [playVsCPU, setPlayVsCPU] = useState(false);
  const [cpuDifficulty, setCpuDifficulty] = useState("Comerciante distraído");

  const [gameState, setGameState] = useState(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isManualAction = useRef(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("jaipur_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("jaipur_theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    localStorage.setItem("jaipur_playerName", playerName);
    localStorage.setItem("jaipur_roomId", roomId);
    localStorage.setItem("jaipur_joinCode", joinCode);
    localStorage.setItem("jaipur_inGame", String(inGame));
    localStorage.setItem("jaipur_isWaiting", String(isWaiting));
  }, [playerName, roomId, joinCode, inGame, isWaiting]);

  const resetToLobby = () => {
    setInGame(false);
    setIsWaiting(false);
    setRoomId("");
    setJoinCode("");
    setGameState(null);
    setOpponentConnected(false);
    setShowLeaveModal(false);

    localStorage.removeItem("jaipur_roomId");
    localStorage.removeItem("jaipur_joinCode");
    localStorage.removeItem("jaipur_inGame");
    localStorage.removeItem("jaipur_isWaiting");
  };

  useEffect(() => {
    const onConnect = () => {
      const savedRoomId = localStorage.getItem("jaipur_roomId");
      const savedPlayerName = localStorage.getItem("jaipur_playerName");
      const wasInGame = localStorage.getItem("jaipur_inGame") === "true";
      const wasWaiting = localStorage.getItem("jaipur_isWaiting") === "true";

      if ((wasInGame || wasWaiting) && savedRoomId && savedPlayerName) {
        isManualAction.current = false;

        socket.emit("reconnectRoom", {
          roomId: savedRoomId,
          playerName: savedPlayerName,
        });
      }
    };

    socket.on("connect", onConnect);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  useEffect(() => {
    socket.on("roomCreated", (id) => {
      setRoomId(id);
      setIsWaiting(true);
      setInGame(false);
      setOpponentConnected(false);
      isManualAction.current = false;
    });

    socket.on("gameReady", () => {
      setIsWaiting(false);
      setInGame(true);
      setOpponentConnected(true);
      isManualAction.current = false;
    });

    socket.on("waitingRestored", ({ roomId: restoredRoomId }) => {
      setRoomId(restoredRoomId);
      setIsWaiting(true);
      setInGame(false);
      setOpponentConnected(false);
      isManualAction.current = false;
    });

    socket.on("updateGameState", (newState) => {
      setGameState(newState);
      setIsWaiting(false);
      setInGame(true);
    });

    socket.on("restoreFailed", (msg) => {
      resetToLobby();
      setErrorMsg(msg);
      isManualAction.current = false;
    });

    socket.on("errorMsg", (msg) => {
      setErrorMsg(msg);

      if (
        msg.includes("encerrada") ||
        msg.includes("não encontrada") ||
        msg.includes("cheia")
      ) {
        resetToLobby();
      }

      isManualAction.current = false;
    });

    socket.on("opponentDisconnected", () => {
      setErrorMsg("O oponente saiu da sala ou a partida foi encerrada.");
      resetToLobby();
    });

    socket.on("opponentTemporarilyDisconnected", () => {
      setOpponentConnected(false);
    });

    socket.on("opponentReconnected", () => {
      setOpponentConnected(true);
    });

    socket.on("opponentLeftPostGame", () => {
      setOpponentConnected(false);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("gameReady");
      socket.off("waitingRestored");
      socket.off("updateGameState");
      socket.off("restoreFailed");
      socket.off("errorMsg");
      socket.off("opponentDisconnected");
      socket.off("opponentTemporarilyDisconnected");
      socket.off("opponentReconnected");
      socket.off("opponentLeftPostGame");
    };
  }, []);

  const createRoom = () => {
    isManualAction.current = true;

    if (playerName.trim() === "") {
      isManualAction.current = false;
      return setErrorMsg("Por favor, digite o seu nome primeiro.");
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();

    socket.emit("createRoom", {
      roomId: randomCode,
      playerName,
    });
  };

  const startCPUGame = () => {
    isManualAction.current = true;

    if (playerName.trim() === "") {
      isManualAction.current = false;
      return setErrorMsg("Por favor, digite o seu nome primeiro.");
    }

    const cpuRoomCode =
      "CPU-" + Math.floor(1000 + Math.random() * 9000).toString();

    setRoomId(cpuRoomCode);
    setIsWaiting(false);

    socket.emit("createRoomVsCPU", {
      roomId: cpuRoomCode,
      playerName,
      difficulty: cpuDifficulty,
    });
  };

  const joinRoom = () => {
    isManualAction.current = true;

    if (playerName.trim() === "") {
      isManualAction.current = false;
      return setErrorMsg("Por favor, digite o seu nome primeiro.");
    }

    if (joinCode.trim() === "") {
      isManualAction.current = false;
      return setErrorMsg("Por favor, digite o código da sala.");
    }

    const normalizedCode = joinCode.trim();

    setRoomId(normalizedCode);

    socket.emit("joinRoom", {
      roomId: normalizedCode,
      playerName,
    });
  };

  const requestLeaveRoom = () => setShowLeaveModal(true);

  const cancelLeaveRoom = () => setShowLeaveModal(false);

  const confirmLeaveRoom = () => {
    socket.emit("leaveRoom", roomId);
    resetToLobby();
  };

  return (
    <div className="min-h-screen bg-[#fcf8e8] dark:bg-gray-900 transition-colors duration-300 text-gray-800 dark:text-gray-100 font-body overflow-x-hidden">
      {!inGame && (
        <button
          onClick={toggleTheme}
          className="absolute top-4 left-4 p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-md hover:scale-110 transition-transform z-10 border border-gray-200 dark:border-gray-700"
          title="Alternar Tema"
        >
          {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
        </button>
      )}

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
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-sm w-full border-t-8 border-jaipur-gold text-center"
            >
              <h3 className="text-2xl font-display font-bold text-gray-800 dark:text-white mb-3">
                ⚠️ Aviso
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-bold mb-8 text-sm">
                {errorMsg}
              </p>
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
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-sm w-full border-t-8 border-jaipur-red text-center"
            >
              <h3 className="text-2xl font-display font-bold text-gray-800 dark:text-white mb-3">
                Abandonar Partida?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-bold mb-8 text-sm">
                Tem a certeza que deseja sair da sala? A partida será encerrada.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelLeaveRoom}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLeaveRoom}
                  className="flex-1 py-3 px-4 bg-jaipur-red text-white font-bold rounded-lg hover:bg-red-800 transition-colors shadow-md"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {inGame && gameState ? (
        <div className="p-2 md:p-4">
          <GameBoard
            gameState={gameState}
            socket={socket}
            roomId={roomId}
            opponentConnected={opponentConnected}
            onLeaveRoom={requestLeaveRoom}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </div>
      ) : isWaiting ? (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-xl shadow-2xl text-center border-t-8 border-jaipur-green relative max-w-md w-full">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={requestLeaveRoom}
              className="absolute top-4 right-4 text-jaipur-red font-bold hover:opacity-80 touch-manipulation p-2 text-sm"
            >
              X Cancelar
            </motion.button>
            <img
              src="/images/logo.png"
              alt="Rota dos Camelos"
              className="h-28 mx-auto mb-6 object-contain drop-shadow-md"
            />
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 dark:text-white mb-2 animate-pulse">
              ⏳ Aguardando...
            </h2>
            <p className="text-gray-600 dark:text-gray-300 font-bold mb-6 text-sm">
              A sua sala está pronta. Partilhe o código abaixo:
            </p>
            <div className="bg-desert-light dark:bg-gray-700 py-4 rounded-lg border border-desert-dark dark:border-gray-600 mb-2">
              <div className="text-5xl font-display font-bold text-jaipur-green tracking-widest drop-shadow-sm">
                {roomId}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border-t-8 border-jaipur-green text-center transition-colors">
            <img
              src="/images/logo.png"
              alt="Rota dos Camelos"
              className="h-48 md:h-64 mx-auto mb-2 object-contain drop-shadow-md"
            />
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-bold">
              O mercado te aguarda!
            </p>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                maxLength="12"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-jaipur-green text-center text-lg font-bold touch-manipulation transition-colors"
                placeholder="O SEU NOME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />

              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setPlayVsCPU(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                    !playVsCPU
                      ? "bg-white dark:bg-gray-600 text-jaipur-green shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FaUserFriends /> Amigos
                </button>
                <button
                  onClick={() => setPlayVsCPU(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                    playVsCPU
                      ? "bg-jaipur-gold text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FaRobot /> Bot
                </button>
              </div>

              <AnimatePresence mode="wait">
                {playVsCPU ? (
                  <motion.div
                    key="cpu-mode"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-left">
                        Nível de Dificuldade:
                      </p>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            setCpuDifficulty("Comerciante distraído")
                          }
                          className={`py-3 px-4 rounded-lg border-2 font-bold text-sm text-left transition-all flex items-center justify-between ${
                            cpuDifficulty === "Comerciante distraído"
                              ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/40 dark:border-green-500 dark:text-green-400 shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:border-green-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <span>🟢 Fácil</span>
                          <span className="font-normal opacity-80 text-xs">
                            Comerciante Distraído
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            setCpuDifficulty("Mercador Experiente")
                          }
                          className={`py-3 px-4 rounded-lg border-2 font-bold text-sm text-left transition-all flex items-center justify-between ${
                            cpuDifficulty === "Mercador Experiente"
                              ? "bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-900/40 dark:border-yellow-500 dark:text-yellow-400 shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:border-yellow-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <span>🟡 Médio</span>
                          <span className="font-normal opacity-80 text-xs">
                            Mercador Experiente
                          </span>
                        </button>

                        <button
                          onClick={() => setCpuDifficulty("Mestre do Souq")}
                          className={`py-3 px-4 rounded-lg border-2 font-bold text-sm text-left transition-all flex items-center justify-between ${
                            cpuDifficulty === "Mestre do Souq"
                              ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/40 dark:border-red-500 dark:text-red-400 shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:border-red-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <span>🔴 Difícil</span>
                          <span className="font-normal opacity-80 text-xs">
                            Mestre do Souq
                          </span>
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={startCPUGame}
                      className="w-full bg-jaipur-gold hover:bg-yellow-600 text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-md text-lg touch-manipulation select-none mt-2"
                    >
                      🤖 Iniciar partida
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="multiplayer-mode"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-4 overflow-hidden"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={createRoom}
                      className="w-full bg-jaipur-green hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-md text-lg touch-manipulation select-none mt-2"
                    >
                      🌟 Criar Nova Sala
                    </motion.button>

                    <div className="flex items-center my-1">
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                      <span className="px-3 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">
                        ou entrar com código
                      </span>
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength="4"
                        className="w-2/3 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-jaipur-gold text-center text-xl tracking-widest font-bold touch-manipulation transition-colors"
                        placeholder="CÓDIGO"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={joinRoom}
                        className="w-1/3 bg-gray-600 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold py-3 px-2 rounded-lg transition-colors shadow-md text-sm touch-manipulation select-none"
                      >
                        Entrar
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
