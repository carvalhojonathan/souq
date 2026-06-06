// backend/cpuBot.js

// 1. O Robô olha para a mesa e lista tudo o que é possível fazer
function getValidMoves(gameState, botId) {
  const bot = gameState.players[botId];
  const moves = [];

  // VENDER MERCADORIAS
  const groupedHand = {};
  bot.hand.forEach((card, index) => {
    if (!groupedHand[card]) groupedHand[card] = [];
    groupedHand[card].push(index);
  });

  for (const [cardType, indices] of Object.entries(groupedHand)) {
    const isLuxury = ["diamond", "gold", "silver"].includes(cardType);
    // Pode vender se for normal ou se for de luxo e tiver 2 ou mais
    if (!isLuxury || indices.length >= 2) {
      moves.push({ type: "SELL_GOODS", payload: { handIndices: indices } });
    }
  }

  // PEGAR CAMELOS
  const camelCount = gameState.market.filter((c) => c === "camel").length;
  if (camelCount > 0) {
    moves.push({ type: "TAKE_CAMELS", payload: {} });
  }

  // COMPRAR 1 CARTA
  if (bot.hand.length < 7) {
    gameState.market.forEach((card, i) => {
      if (card !== "camel") {
        moves.push({ type: "TAKE_ONE", payload: { marketIndex: i } });
      }
    });
  }

  // TROCAR CARTAS (Tática básica do Robô: Dar camelos por mercadorias)
  const marketGoodsIndices = [];
  gameState.market.forEach((card, i) => {
    if (card !== "camel") marketGoodsIndices.push(i);
  });

  const maxTrade = Math.min(bot.herd.length, marketGoodsIndices.length);
  if (maxTrade >= 2 && bot.hand.length + maxTrade <= 7) {
    moves.push({
      type: "TAKE_SEVERAL",
      payload: {
        marketIndices: marketGoodsIndices.slice(0, maxTrade),
        handIndices: [],
        herdCount: maxTrade,
      },
    });
  }

  return moves;
}

// 2. O Cérebro: O Robô avalia as opções dependendo da dificuldade
function calculateBotAction(gameState, difficulty) {
  const moves = getValidMoves(gameState, "CPU");

  if (moves.length === 0) {
    // Segurança máxima, não deve acontecer nas regras normais, mas impede crash
    return null;
  }

  // FÁCIL: Comerciante Distraído (Joga totalmente à sorte)
  if (difficulty === "Comerciante distraído") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // NORMAL e DIFÍCIL: Sistema de Pontuação de Jogadas
  let bestMove = moves[0];
  let bestScore = -999;

  for (const move of moves) {
    let score = 0;

    if (move.type === "SELL_GOODS") {
      const count = move.payload.handIndices.length;
      const goodType =
        gameState.players["CPU"].hand[move.payload.handIndices[0]];
      const isLuxury = ["diamond", "gold", "silver"].includes(goodType);

      score += count * 2; // Gosta de vender várias
      if (isLuxury) score += 5; // Gosta de vender luxos
      if (count >= 3) score += 10; // Adora as fichas de bónus!

      // O Mestre do Souq (Difícil) tem paciência e odeia vender pouco!
      if (difficulty === "Mestre do Souq" && count < 3 && !isLuxury) {
        score -= 10;
      }
    } else if (move.type === "TAKE_ONE") {
      const goodType = gameState.market[move.payload.marketIndex];
      const isLuxury = ["diamond", "gold", "silver"].includes(goodType);
      if (isLuxury) score += 8;
      else score += 3;
    } else if (move.type === "TAKE_CAMELS") {
      const camelCount = gameState.market.filter((c) => c === "camel").length;
      score += camelCount;
      // O Mestre do Souq esvazia o mercado para atrapalhar e ganhar os 5 pontos de rebanho finais
      if (difficulty === "Mestre do Souq" && camelCount >= 3) score += 8;
    } else if (move.type === "TAKE_SEVERAL") {
      score += 6; // Trocar camelos por cartas é geralmente uma boa jogada
    }

    // Pinguinho de aleatoriedade para não ser 100% previsível
    score += Math.random() * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// 3. A Função principal que o seu Servidor vai chamar
function executeBotTurn(roomId, gameState, difficulty, processActionFunc) {
  console.log(
    `🤖 [CPU] A pensar na sala ${roomId}... Dificuldade: ${difficulty}`,
  );

  // O "Toque Humano": Exatos 5 segundos de delay artificial
  setTimeout(() => {
    const action = calculateBotAction(gameState, difficulty);

    if (action) {
      console.log(`🤖 [CPU] Decidiu jogar: ${action.type}`);
      // Usa a mesma função do seu servidor como se fosse um humano a clicar!
      processActionFunc(roomId, "CPU", action);
    }
  }, 5000);
}

module.exports = { executeBotTurn };
