import React from "react";
import { motion } from "framer-motion";
import {
  FaCoins,
  FaAward,
  FaHome,
  FaArrowRight,
  FaHourglassHalf,
} from "react-icons/fa";

export default function RoundEndModal({
  stats,
  myId,
  players,
  onNextRound,
  onLeaveRoom,
}) {
  if (!stats || !players) return null;

  // Identifica quem é o anfitrião (O primeiro jogador a entrar na sala)
  const hostId = Object.keys(players)[0];
  const isHost = myId === hostId;
  const opponentId = Object.keys(players).find((id) => id !== myId);

  const myName = players[myId]?.name || "Você";
  const oppName =
    opponentId && players[opponentId] ? players[opponentId].name : "Oponente";

  const myScore = stats.scores?.[myId] || 0;
  const oppScore = stats.scores?.[opponentId] || 0;

  const amIWinner = stats.roundWinnerId === myId;
  const matchWinner = stats.matchWinnerId;

  const mySeals = players[myId]?.seals || 0;
  const oppSeals = players[opponentId]?.seals || 0;

  // Função para calcular os pontos detalhados por tipo de ficha
  const getDetailedPoints = (player, details) => {
    const pts = {
      diamond: 0,
      gold: 0,
      silver: 0,
      cloth: 0,
      spice: 0,
      leather: 0,
      bonus: 0,
      camel: 0,
    };

    if (player && player.tokens) {
      player.tokens.forEach((t) => {
        if (t.type === "bonus" || (t.id && t.id.includes("bonus"))) {
          pts.bonus += t.value;
        } else if (
          t.type === "camel" ||
          t.id === "camel" ||
          t.name === "camel"
        ) {
          pts.camel += t.value || 5;
        } else {
          const key = t.good || t.goodType || t.id || t.name;
          if (pts[key] !== undefined) pts[key] += t.value;
        }
      });
    }

    // Garantia para o bónus do camelo (caso venha separado no objeto stats)
    if (details?.hasCamelBonus && pts.camel === 0) {
      pts.camel = 5;
    }

    return pts;
  };

  const myDetailedPoints = getDetailedPoints(
    players[myId],
    stats.stats?.[myId],
  );
  const oppDetailedPoints = getDetailedPoints(
    players[opponentId],
    stats.stats?.[opponentId],
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#fcf8e8] dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-2xl w-full border-4 border-jaipur-gold dark:border-jaipur-gold relative transition-colors"
      >
        {/* Título Principal */}
        <h2
          className={`text-3xl md:text-4xl font-display font-bold mb-6 text-center drop-shadow-sm ${matchWinner ? (matchWinner === myId ? "text-jaipur-green dark:text-green-400" : "text-jaipur-red dark:text-red-400") : amIWinner ? "text-jaipur-green dark:text-green-400" : "text-jaipur-red dark:text-red-400"}`}
        >
          {matchWinner
            ? matchWinner === myId
              ? "🏆 VOCÊ VENCEU O JOGO!"
              : "💀 VOCÊ PERDEU O JOGO."
            : amIWinner
              ? "🎉 VOCÊ VENCEU A RODADA!"
              : "❌ VOCÊ PERDEU A RODADA."}
        </h2>

        {/* Resumo Detalhado das Pontuações */}
        <div className="flex flex-col gap-4 mb-8">
          <StatRow
            name={myName}
            isWinner={amIWinner}
            score={myScore}
            points={myDetailedPoints}
            seals={mySeals}
            isMe={true}
          />
          <StatRow
            name={oppName}
            isWinner={!amIWinner}
            score={oppScore}
            points={oppDetailedPoints}
            seals={oppSeals}
            isMe={false}
          />
        </div>

        {/* Área de Botões */}
        <div className="flex flex-col gap-3 mt-6">
          {matchWinner ? (
            <button
              onClick={onLeaveRoom}
              className="w-full bg-jaipur-gold hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-lg text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <FaHome className="text-xl" /> Ir para Tela Inicial
            </button>
          ) : (
            <>
              {isHost ? (
                <button
                  onClick={onNextRound}
                  className="w-full bg-jaipur-green hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                  Próxima Rodada <FaArrowRight />
                </button>
              ) : (
                <div className="w-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 font-bold py-4 rounded-xl shadow-inner text-center flex items-center justify-center gap-3 text-sm md:text-base transition-colors">
                  <FaHourglassHalf className="animate-spin-slow text-lg" />
                  Aguardando o anfitrião continuar a partida...
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Sub-componente com os pontos detalhados por ficha
function StatRow({ name, isWinner, score, points, seals, isMe }) {
  const bgColor = isMe
    ? "bg-green-50 dark:bg-green-900/20"
    : "bg-red-50 dark:bg-red-900/20";
  const borderColor = isMe
    ? "border-jaipur-green dark:border-green-600"
    : "border-jaipur-red dark:border-red-600";
  const textColor = isMe
    ? "text-jaipur-green dark:text-green-400"
    : "text-jaipur-red dark:text-red-400";

  return (
    <div
      className={`p-4 rounded-xl border-2 flex flex-col gap-3 transition-colors ${isWinner ? `${bgColor} ${borderColor}` : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"}`}
    >
      {/* Cabeçalho do Jogador (Nome e Selos) */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-2 transition-colors">
        <span
          className={`font-bold text-lg md:text-xl ${textColor} uppercase tracking-wide`}
        >
          {name} {isMe && "(Você)"}
        </span>
        <div
          className="flex gap-1"
          title={`${seals} Selos de Excelência (Vitórias)`}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <FaAward
              key={i}
              className={`text-2xl transition-colors ${i < seals ? "text-jaipur-gold drop-shadow-md" : "text-gray-200 dark:text-gray-600"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        {/* Detalhamento de Pontos em Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium transition-colors w-full sm:w-auto">
          {points.diamond > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              💎 Diamante:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.diamond}
              </strong>
            </span>
          )}
          {points.gold > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              🪙 Ouro:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.gold}
              </strong>
            </span>
          )}
          {points.silver > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              🥈 Prata:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.silver}
              </strong>
            </span>
          )}
          {points.cloth > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              👘 Tecido:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.cloth}
              </strong>
            </span>
          )}
          {points.spice > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              🌶️ Especiaria:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.spice}
              </strong>
            </span>
          )}
          {points.leather > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              👜 Couro:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.leather}
              </strong>
            </span>
          )}
          {points.bonus > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              🎁 Bônus:{" "}
              <strong className="text-gray-800 dark:text-white">
                {points.bonus}
              </strong>
            </span>
          )}
          {points.camel > 0 && (
            <span className="flex items-center gap-1 whitespace-nowrap text-jaipur-gold">
              🐪 Rebanho: <strong>{points.camel}</strong>
            </span>
          )}

          {/* Fallback se o jogador não tiver feito nenhum ponto */}
          {Object.values(points).every((v) => v === 0) && (
            <span className="col-span-2 text-gray-400 italic">
              Nenhum ponto registrado.
            </span>
          )}
        </div>

        {/* Soma Total de PONTOS */}
        <div
          className={`flex items-center gap-2 text-4xl md:text-5xl font-display font-bold transition-colors self-end sm:self-auto ${textColor}`}
        >
          <FaCoins className="text-jaipur-gold text-3xl md:text-4xl drop-shadow-sm" />{" "}
          {score}
        </div>
      </div>
    </div>
  );
}
