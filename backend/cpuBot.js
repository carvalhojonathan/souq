// backend/cpuBot.js

// ==========================================
// FUNÇÕES AUXILIARES DE LEITURA DA MESA
// ==========================================

function getTopTokenValue(gameState, type) {
  if (!gameState.tokens[type] || gameState.tokens[type].length === 0) return 0;
  return gameState.tokens[type][0].value;
}

function getExpectedBonus(count) {
  if (count === 3) return 2.5;
  if (count === 4) return 5;
  if (count >= 5) return 9;
  return 0;
}

// ==========================================
// 1. GERADOR DE JOGADAS
// ==========================================
function getValidMoves(gameState, botId) {
  const bot = gameState.players[botId];
  const moves = [];

  // 1. VENDER MERCADORIAS
  const groupedHand = {};
  bot.hand.forEach((card, index) => {
    if (!groupedHand[card]) groupedHand[card] = [];
    groupedHand[card].push(index);
  });

  for (const [cardType, indices] of Object.entries(groupedHand)) {
    const isLuxury = ["diamond", "gold", "silver"].includes(cardType);
    if (!isLuxury || indices.length >= 2) {
      moves.push({ type: "SELL_GOODS", payload: { handIndices: indices } });
    }
  }

  // 2. PEGAR CAMELOS
  const camelCount = gameState.market.filter((c) => c === "camel").length;
  if (camelCount > 0) {
    moves.push({ type: "TAKE_CAMELS", payload: {} });
  }

  // 3. COMPRAR 1 CARTA
  if (bot.hand.length < 7) {
    gameState.market.forEach((card, i) => {
      if (card !== "camel") {
        moves.push({ type: "TAKE_ONE", payload: { marketIndex: i } });
      }
    });
  }

  // 4. TROCAR CARTAS
  const marketCards = gameState.market
    .map((type, index) => ({
      type,
      index,
      val: getTopTokenValue(gameState, type),
    }))
    .filter((c) => c.type !== "camel")
    .sort((a, b) => b.val - a.val);

  const handCards = bot.hand
    .map((type, index) => ({
      type,
      index,
      val: getTopTokenValue(gameState, type),
    }))
    .sort((a, b) => a.val - b.val);

  const herdCount = bot.herd.length;
  const maxTrade = Math.min(marketCards.length, handCards.length + herdCount);

  if (maxTrade >= 2) {
    for (let k = 2; k <= maxTrade; k++) {
      const takeIndices = marketCards.slice(0, k).map((c) => c.index);
      const takeTypes = marketCards.slice(0, k).map((c) => c.type);

      const giveHandIndices = [];
      let camelsToGive = 0;
      let itemsGathered = 0;

      const validHandCards = handCards.filter(
        (c) => !takeTypes.includes(c.type),
      );

      for (const hc of validHandCards) {
        if (itemsGathered < k) {
          giveHandIndices.push(hc.index);
          itemsGathered++;
        }
      }

      while (itemsGathered < k && camelsToGive < herdCount) {
        camelsToGive++;
        itemsGathered++;
      }

      const newHandSize = bot.hand.length - giveHandIndices.length + k;
      if (itemsGathered === k && newHandSize <= 7) {
        moves.push({
          type: "TAKE_SEVERAL",
          payload: {
            marketIndices: takeIndices,
            handIndices: giveHandIndices,
            herdCount: camelsToGive,
          },
        });
      }
    }
  }

  return moves;
}

// ==========================================
// 2. AVALIADOR DE JOGADAS (O CÉREBRO)
// ==========================================
function evaluateMove(gameState, move, difficulty) {
  const bot = gameState.players["CPU"];
  const oppId = Object.keys(gameState.players).find((id) => id !== "CPU");
  const opp = gameState.players[oppId];

  // O Mestre do Souq tem Noção de Tempo: Se o jogo está perto do fim, ele muda de tática!
  const emptyTokenStacks = [
    "diamond",
    "gold",
    "silver",
    "cloth",
    "spice",
    "leather",
  ].filter(
    (t) => !gameState.tokens[t] || gameState.tokens[t].length === 0,
  ).length;
  const isEndgame = emptyTokenStacks >= 2 || gameState.deck.length <= 6;

  let score = 0;

  if (move.type === "SELL_GOODS") {
    const count = move.payload.handIndices.length;
    const goodType = bot.hand[move.payload.handIndices[0]];
    const isLuxury = ["diamond", "gold", "silver"].includes(goodType);

    let points = 0;
    const tokens = gameState.tokens[goodType] || [];
    for (let i = 0; i < count && i < tokens.length; i++)
      points += tokens[i].value;
    points += getExpectedBonus(count);

    score = points;

    if (difficulty === "Comerciante distraído") {
      if (count < 3 && !isLuxury) score -= 15;
      if (isLuxury) score += 10;
      if (count >= 4) score += 8;
    } else if (difficulty === "Mercador Experiente") {
      if (isLuxury) score += 15;
      if (count < 3 && !isLuxury) score -= 30;
      if (count >= 4) score += 15;
      if (gameState.market.includes(goodType) && bot.hand.length < 7)
        score -= 15;
    } else if (difficulty === "Mestre do Souq") {
      // 1. MODO DESESPERO (Fim de jogo): Vende tudo o que tem para pontuar e forçar o fim!
      if (isEndgame) {
        score += 40;
      }

      // 2. CORRIDA: Se o oponente tem a mesma carta, venda rápido para roubar as melhores fichas!
      const oppHas = opp.hand.filter((c) => c === goodType).length;
      if (oppHas >= 2 && !isEndgame) {
        score += 25;
      }

      if (isLuxury) {
        score += 20;
      } else {
        // Se não for fim de jogo nem corrida, ele odeia vender pouco tecido/especiaria
        if (count < 3 && !isEndgame && oppHas < 2) score -= 40;
      }

      if (count >= 4) score += 30; // Prioridade gigante a bónus de 4 e 5

      // Se há mais da carta no mercado, pega em vez de vender (se tiver espaço)
      if (
        gameState.market.includes(goodType) &&
        bot.hand.length < 7 &&
        !isEndgame
      ) {
        score -= 30;
      }
    }
  } else if (move.type === "TAKE_ONE") {
    const type = gameState.market[move.payload.marketIndex];
    const isLuxury = ["diamond", "gold", "silver"].includes(type);
    const val = getTopTokenValue(gameState, type);

    score = val * 1.5;
    if (isLuxury) score += 8;

    if (difficulty === "Comerciante distraído") {
      score += bot.hand.filter((c) => c === type).length * 2;
    } else if (difficulty === "Mercador Experiente") {
      score += bot.hand.filter((c) => c === type).length * 5;
      if (isLuxury) score += 10;
    } else if (difficulty === "Mestre do Souq") {
      score += bot.hand.filter((c) => c === type).length * 8;
      if (isLuxury) score += 20;

      // 3. NEGAÇÃO (BLOCKING): O Mestre lê a sua mão. Se vir que você está a juntar, ele rouba a carta!
      const oppHas = opp.hand.filter((c) => c === type).length;
      if (oppHas >= 2) score += 35; // Impede bónus grandes!
      if (isLuxury && oppHas >= 1) score += 30; // Impede que você feche um par de luxo!

      // 4. RISCO DO BARALHO: Se a sua mão está vazia, o Mestre evita pegar cartas normais soltas
      // para não abrir uma carta de Diamante do baralho grátis para si!
      if (opp.handCount <= 5 && !isLuxury && !isEndgame) score -= 15;
    }
  } else if (move.type === "TAKE_SEVERAL") {
    let valGained = 0;
    let luxuryCount = 0;
    move.payload.marketIndices.forEach((idx) => {
      const t = gameState.market[idx];
      valGained += getTopTokenValue(gameState, t);
      if (["diamond", "gold", "silver"].includes(t)) luxuryCount++;
    });

    let valLost = 0;
    move.payload.handIndices.forEach((idx) => {
      valLost += getTopTokenValue(gameState, bot.hand[idx]);
    });
    valLost += move.payload.herdCount * 1.5;

    score = (valGained - valLost) * 2;
    if (luxuryCount > 0) score += 12;

    if (
      difficulty === "Mercador Experiente" ||
      difficulty === "Mestre do Souq"
    ) {
      if (score <= 0) score -= 50;
      if (luxuryCount >= 2) score += 20;
    }

    if (difficulty === "Mestre do Souq") {
      // Se oponente está fraco, rouba tudo
      if (opp.handCount < 4 && luxuryCount > 0) score += 20;

      // 5. TROCA VENENOSA: O Mestre verifica se a carta que ele vai deitar no mercado
      // é algo que você já tem na mão. Se for, ele cancela a troca para não o ajudar!
      let feedingScore = 0;
      move.payload.handIndices.forEach((idx) => {
        const gaveType = bot.hand[idx];
        if (opp.hand.includes(gaveType)) feedingScore += 30;
      });
      score -= feedingScore;
    }
  } else if (move.type === "TAKE_CAMELS") {
    const camelCount = gameState.market.filter((c) => c === "camel").length;
    score = camelCount * 1.5;

    if (difficulty === "Comerciante distraído") {
      if (bot.herd.length < 2) score += 6;
      if (camelCount >= 3) score -= 5;
    } else if (difficulty === "Mercador Experiente") {
      if (bot.herd.length === 0) score += 10;
      if (camelCount >= 3 && bot.herd.length >= 4) score -= 15;
    } else if (difficulty === "Mestre do Souq") {
      if (bot.herd.length === 0) score += 15;

      // 6. ARMADILHA MAGISTRAL:
      // Se você (oponente) tem 6 ou 7 cartas, não pode pegar no mercado.
      // O Mestre limpa os camelos só para colocar cartas novas na mesa sabendo que você não as pode pegar!
      if (opp.handCount >= 6 && camelCount >= 2) {
        score += 50;
      }
      // Se você tem espaço (menos de 5 cartas), ele recusa-se a pegar camelos para não lhe dar as cartas do baralho.
      else if (
        opp.handCount <= 5 &&
        camelCount >= 2 &&
        gameState.deck.length > 5
      ) {
        score -= 40;
      }
    }
  }

  return score;
}

// ==========================================
// 3. EXECUÇÃO DO TURNO
// ==========================================
function calculateBotAction(gameState, difficulty) {
  const moves = getValidMoves(gameState, "CPU");
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -9999;

  for (const move of moves) {
    let score = evaluateMove(gameState, move, difficulty);

    // Pequena margem de aleatoriedade para não ser 100% previsível
    if (difficulty === "Comerciante distraído") {
      score += Math.random() * 3;
    } else if (difficulty === "Mercador Experiente") {
      score += Math.random() * 0.1;
    } else {
      // Mestre joga matematicamente perfeito.
      score += Math.random() * 0.001;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function executeBotTurn(roomId, gameState, difficulty, processActionFunc) {
  setTimeout(() => {
    const action = calculateBotAction(gameState, difficulty);
    if (action) processActionFunc(roomId, "CPU", action);
  }, 4000); // 4 segundos de atraso para dar uma dinâmica natural
}

module.exports = { executeBotTurn };
