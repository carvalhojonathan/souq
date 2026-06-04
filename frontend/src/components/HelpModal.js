import React from "react";
import { motion } from "framer-motion";

export default function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-desert-light p-8 rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-desert-dark max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-3xl font-display font-bold text-emerald border-b-2 border-emerald pb-4 mb-6 text-center">
          📜 Regras do Mercado
        </h2>

        <div className="space-y-4 text-gray-800 font-body leading-relaxed">
          <p>
            <strong>Turno:</strong> No seu turno, deve realizar apenas uma ação:{" "}
            <em>Recolher Cartas</em> OU <em>Vender Cartas</em>.
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Recolher 1 Mercadoria:</strong> Pode recolher uma única
              carta do mercado. Limite de 7 cartas na mão.
            </li>
            <li>
              <strong>Recolher Camelos:</strong> Tem de recolher <em>todos</em>{" "}
              os camelos disponíveis no mercado para o seu rebanho.
            </li>
            <li>
              <strong>Trocar (Recolher Várias):</strong> Troque 2 ou mais cartas
              da sua mão/rebanho por mercadorias do mercado. Não pode trocar
              pelo mesmo tipo.
            </li>
            <li>
              <strong>Vender Mercadoria:</strong> Venda cartas iguais da sua
              mão. Se vender Ouro, Prata ou Diamante, precisa de descartar no
              mínimo 2 cartas de uma vez.
            </li>
          </ul>

          <p className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300 text-yellow-900 text-sm">
            <strong>Dicas de Mestre:</strong> Vender 3, 4 ou 5 cartas iguais
            garante uma ficha de bónus oculta! Além disso, quem tiver o maior
            rebanho de camelos no final da rodada recebe 5 Rúpias extras.
          </p>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="bg-emerald text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-green-800 transition"
          >
            Entendido, Voltar ao Jogo!
          </button>
        </div>
      </motion.div>
    </div>
  );
}
