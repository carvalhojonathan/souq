import React from "react";
import { motion } from "framer-motion";
import { FaCoins } from "react-icons/fa";

export default function RoundEndModal({ stats, myId, players, onNextRound }) {
  if (!stats) return null;

  // CORREÇÃO: Extraímos os IDs diretamente dos pontos enviados pelo servidor.
  // Assim, o modal nunca mais fica invisível mesmo que falte algum dado extra!
  const ids = stats.scores ? Object.keys(stats.scores) : [];
  const opponentId = ids.find((id) => id !== myId);

  const myName =
    players && players[myId] && players[myId].name
      ? players[myId].name
      : "Você";
  const oppName =
    players && opponentId && players[opponentId] && players[opponentId].name
      ? players[opponentId].name
      : "Oponente";

  const myScore =
    stats.scores && stats.scores[myId] !== undefined ? stats.scores[myId] : 0;
  const oppScore =
    stats.scores && opponentId && stats.scores[opponentId] !== undefined
      ? stats.scores[opponentId]
      : 0;

  const amIWinner = stats.roundWinnerId === myId;
  const matchWinner = stats.matchWinnerId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-desert-light p-8 rounded-xl shadow-2xl max-w-lg w-full text-center border-4 border-jaipur-gold"
      >
        <h2
          className={`text-4xl font-display font-bold mb-6 ${amIWinner ? "text-jaipur-green" : "text-jaipur-red"}`}
        >
          {matchWinner
            ? matchWinner === myId
              ? "🏆 VOCÊ VENCEU O JOGO!"
              : "💀 VOCÊ PERDEU O JOGO."
            : amIWinner
              ? "🎉 VOCÊ VENCEU A RODADA!"
              : "❌ VOCÊ PERDEU A RODADA."}
        </h2>

        <div className="flex flex-col gap-4 mb-8">
          <div
            className={`p-4 rounded-lg border-2 flex justify-between items-center ${amIWinner ? "bg-green-100 border-jaipur-green" : "bg-white border-gray-300"}`}
          >
            <span className="font-bold text-lg text-gray-800">{myName}</span>
            <div className="flex items-center gap-2 text-2xl font-display font-bold text-jaipur-green">
              <FaCoins className="text-jaipur-gold" /> {myScore}
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border-2 flex justify-between items-center ${!amIWinner ? "bg-red-100 border-jaipur-red" : "bg-white border-gray-300"}`}
          >
            <span className="font-bold text-lg text-gray-800">{oppName}</span>
            <div className="flex items-center gap-2 text-2xl font-display font-bold text-jaipur-red">
              <FaCoins className="text-jaipur-gold" /> {oppScore}
            </div>
          </div>
        </div>

        {matchWinner ? (
          <p className="text-gray-600 font-bold">
            O jogo acabou. Volte ao menu para uma nova partida.
          </p>
        ) : (
          <button
            onClick={onNextRound}
            className="w-full bg-jaipur-gold text-white font-bold py-4 rounded-lg hover:opacity-90 shadow-md text-lg"
          >
            Próxima Rodada
          </button>
        )}
      </motion.div>
    </div>
  );
}
