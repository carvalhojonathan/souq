import React from "react";
import { motion } from "framer-motion";
import {
  FaCoins,
  FaAward,
  FaHome,
  FaArrowRight,
  FaHourglassHalf,
} from "react-icons/fa";
import { GiCamel } from "react-icons/gi";

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

  const myDetailedStats = stats.stats?.[myId] || {};
  const oppDetailedStats = stats.stats?.[opponentId] || {};

  const amIWinner = stats.roundWinnerId === myId;
  const matchWinner = stats.matchWinnerId;

  const mySeals = players[myId]?.seals || 0;
  const oppSeals = players[opponentId]?.seals || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#fcf8e8] p-6 md:p-8 rounded-2xl shadow-2xl max-w-2xl w-full border-4 border-jaipur-gold relative"
      >
        {/* Título Principal */}
        <h2
          className={`text-3xl md:text-4xl font-display font-bold mb-6 text-center drop-shadow-sm ${matchWinner ? (matchWinner === myId ? "text-jaipur-green" : "text-jaipur-red") : amIWinner ? "text-jaipur-green" : "text-jaipur-red"}`}
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
            details={myDetailedStats}
            seals={mySeals}
            isMe={true}
          />
          <StatRow
            name={oppName}
            isWinner={!amIWinner}
            score={oppScore}
            details={oppDetailedStats}
            seals={oppSeals}
            isMe={false}
          />
        </div>

        {/* Área de Botões */}
        <div className="flex flex-col gap-3 mt-6">
          {matchWinner ? (
            // BOTÃO FIM DE JOGO: Ambos podem voltar à tela inicial
            <button
              onClick={onLeaveRoom}
              className="w-full bg-jaipur-gold hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-lg text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <FaHome className="text-xl" /> Ir para Tela Inicial
            </button>
          ) : (
            // BOTÕES FIM DE RODADA: Lógica de Anfitrião vs Oponente
            <>
              {isHost ? (
                <button
                  onClick={onNextRound}
                  className="w-full bg-jaipur-green hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                  Próxima Rodada <FaArrowRight />
                </button>
              ) : (
                <div className="w-full bg-gray-200 border-2 border-gray-300 text-gray-500 font-bold py-4 rounded-xl shadow-inner text-center flex items-center justify-center gap-3 text-sm md:text-base">
                  <FaHourglassHalf className="animate-spin-slow text-lg" />
                  Aguardando o anfitrião continuar a partida...
                </div>
              )}

              {/* Opção secundária para sair a qualquer momento (opcional mas recomendado) */}
              <button
                onClick={onLeaveRoom}
                className="w-full mt-1 text-gray-400 hover:text-gray-600 underline font-bold py-2 rounded-lg text-sm transition-all"
              >
                Sair para a Tela Inicial
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Sub-componente para deixar o código limpo e organizar as linhas de cada jogador
function StatRow({ name, isWinner, score, details, seals, isMe }) {
  const bgColor = isMe ? "bg-green-50" : "bg-red-50";
  const borderColor = isMe ? "border-jaipur-green" : "border-jaipur-red";
  const textColor = isMe ? "text-jaipur-green" : "text-jaipur-red";

  return (
    <div
      className={`p-4 rounded-xl border-2 flex flex-col gap-3 transition-colors ${isWinner ? `${bgColor} ${borderColor}` : "bg-white border-gray-300"}`}
    >
      {/* Cabeçalho do Jogador (Nome e Selos) */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
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
              className={`text-2xl ${i < seals ? "text-jaipur-gold drop-shadow-md" : "text-gray-200"}`}
            />
          ))}
        </div>
      </div>

      {/* Detalhamento de Pontos */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1 text-xs md:text-sm text-gray-600 font-medium">
          <span className="flex items-center gap-1">
            🪙 Fichas de Mercadoria:{" "}
            <strong className="text-gray-800 ml-1">
              {details.goodsTokensCount || 0}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            🎁 Fichas de Bônus:{" "}
            <strong className="text-gray-800 ml-1">
              {details.bonusTokensCount || 0}
            </strong>
          </span>
          <span
            className={`flex items-center gap-1 ${details.hasCamelBonus ? "text-jaipur-gold font-bold" : "text-gray-400"}`}
          >
            <GiCamel className="text-lg" /> Bônus de Rebanho:{" "}
            <strong className="ml-1">
              {details.hasCamelBonus ? "+5" : "0"}
            </strong>
          </span>
        </div>

        {/* Soma Total */}
        <div
          className={`flex items-center gap-2 text-4xl md:text-5xl font-display font-bold ${textColor}`}
        >
          <FaCoins className="text-jaipur-gold text-3xl md:text-4xl drop-shadow-sm" />{" "}
          {score}
        </div>
      </div>
    </div>
  );
}
