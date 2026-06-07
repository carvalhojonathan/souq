// backend/cpuBot.js

// ==========================================
// BOT DA CPU
// Fácil e Médio continuam naturais.
// Difícil / Mestre do Souq joga de forma "apelona":
// - lê a mão real do jogador;
// - vê os valores reais dos bônus;
// - simula respostas do oponente;
// - prioriza bloqueios, timing de venda, camelos e fim de rodada.
// ==========================================

const GOODS = ["diamond", "gold", "silver", "cloth", "spice", "leather"];
const LUXURY = ["diamond", "gold", "silver"];
const BOT_ID = "CPU";

// ==========================================
// UTILITÁRIOS
// ==========================================

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function getOpponentId(gameState, playerId = BOT_ID) {
  return Object.keys(gameState.players).find((id) => id !== playerId);
}

function getTopTokenValue(gameState, type) {
  if (!gameState.tokens[type] || gameState.tokens[type].length === 0) return 0;
  return gameState.tokens[type][0].value || 0;
}

function sumTokens(player) {
  return player.tokens.reduce((sum, token) => sum + (token.value || 0), 0);
}

function countCards(cards) {
  const counts = {};
  cards.forEach((card) => {
    counts[card] = (counts[card] || 0) + 1;
  });
  return counts;
}

function getBonusPileName(count) {
  if (count === 3) return "bonus3";
  if (count === 4) return "bonus4";
  if (count >= 5) return "bonus5";
  return null;
}

function getExpectedBonus(count, gameState = null) {
  if (count < 3) return 0;

  const pileName = getBonusPileName(count);

  // No modo difícil o bot é "vidente": ele sabe o bônus exato do topo.
  if (
    gameState &&
    gameState.tokens[pileName] &&
    gameState.tokens[pileName].length > 0
  ) {
    return gameState.tokens[pileName][0].value || 0;
  }

  if (count === 3) return 2.5;
  if (count === 4) return 5;
  return 9;
}

function getSaleValue(gameState, goodType, count, useExactBonus = false) {
  const tokens = gameState.tokens[goodType] || [];
  let value = 0;

  for (let i = 0; i < count && i < tokens.length; i++) {
    value += tokens[i].value || 0;
  }

  value += getExpectedBonus(count, useExactBonus ? gameState : null);
  return value;
}

function getBestPossibleSaleValue(gameState, hand, useExactBonus = false) {
  const counts = countCards(hand);
  let total = 0;

  for (const type of GOODS) {
    const count = counts[type] || 0;
    if (count === 0) continue;

    const minSell = LUXURY.includes(type) ? 2 : 1;
    if (count < minSell) continue;

    let best = 0;

    for (let amount = minSell; amount <= count; amount++) {
      best = Math.max(
        best,
        getSaleValue(gameState, type, amount, useExactBonus),
      );
    }

    total += best;
  }

  return total;
}

function refillMarket(gameState) {
  while (gameState.market.length < 5 && gameState.deck.length > 0) {
    gameState.market.push(gameState.deck.pop());
  }
}

function combinations(arr, size) {
  const result = [];

  function backtrack(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }

  backtrack(0, []);
  return result;
}

function uniqueMoves(moves) {
  const seen = new Set();
  const result = [];

  for (const move of moves) {
    const key = JSON.stringify(move);

    if (!seen.has(key)) {
      seen.add(key);
      result.push(move);
    }
  }

  return result;
}

function isRoundEnding(gameState) {
  if (gameState.deck.length === 0 && gameState.market.length < 5) return true;

  const emptyStacks = GOODS.filter(
    (type) => !gameState.tokens[type] || gameState.tokens[type].length === 0,
  ).length;

  return emptyStacks >= 3;
}

function getRoundScores(gameState) {
  const playerIds = Object.keys(gameState.players);
  const [p1Id, p2Id] = playerIds;
  const p1 = gameState.players[p1Id];
  const p2 = gameState.players[p2Id];

  const stats = {
    [p1Id]: {
      rupees: sumTokens(p1),
      bonusTokensCount: p1.tokens.filter((t) => t.type === "bonus").length,
      goodsTokensCount: p1.tokens.filter((t) => t.type === "good").length,
      hasCamelBonus: false,
    },
    [p2Id]: {
      rupees: sumTokens(p2),
      bonusTokensCount: p2.tokens.filter((t) => t.type === "bonus").length,
      goodsTokensCount: p2.tokens.filter((t) => t.type === "good").length,
      hasCamelBonus: false,
    },
  };

  if (p1.herd.length > p2.herd.length) {
    stats[p1Id].rupees += 5;
    stats[p1Id].hasCamelBonus = true;
  } else if (p2.herd.length > p1.herd.length) {
    stats[p2Id].rupees += 5;
    stats[p2Id].hasCamelBonus = true;
  }

  let winnerId = null;

  if (stats[p1Id].rupees > stats[p2Id].rupees) {
    winnerId = p1Id;
  } else if (stats[p2Id].rupees > stats[p1Id].rupees) {
    winnerId = p2Id;
  } else if (stats[p1Id].bonusTokensCount > stats[p2Id].bonusTokensCount) {
    winnerId = p1Id;
  } else if (stats[p2Id].bonusTokensCount > stats[p1Id].bonusTokensCount) {
    winnerId = p2Id;
  } else if (stats[p1Id].goodsTokensCount > stats[p2Id].goodsTokensCount) {
    winnerId = p1Id;
  } else if (stats[p2Id].goodsTokensCount > stats[p1Id].goodsTokensCount) {
    winnerId = p2Id;
  } else {
    winnerId = p1Id;
  }

  return { stats, winnerId };
}

function getEmptyTokenStackCount(gameState) {
  return GOODS.filter(
    (type) => !gameState.tokens[type] || gameState.tokens[type].length === 0,
  ).length;
}

function getMarketCount(gameState, type) {
  return gameState.market.filter((card) => card === type).length;
}

// ==========================================
// GERADOR DE JOGADAS
// ==========================================

function getValidMoves(gameState, playerId) {
  const player = gameState.players[playerId];
  if (!player) return [];

  const moves = [];

  // 1. VENDER MERCADORIAS
  const groupedHand = {};

  player.hand.forEach((card, index) => {
    if (!groupedHand[card]) groupedHand[card] = [];
    groupedHand[card].push(index);
  });

  for (const [cardType, indices] of Object.entries(groupedHand)) {
    if (cardType === "camel") continue;

    const isLuxury = LUXURY.includes(cardType);
    const minSell = isLuxury ? 2 : 1;

    if (indices.length >= minSell) {
      for (let amount = minSell; amount <= indices.length; amount++) {
        moves.push({
          type: "SELL_GOODS",
          payload: { handIndices: indices.slice(0, amount) },
        });
      }
    }
  }

  // 2. PEGAR CAMELOS
  const camelCount = gameState.market.filter((c) => c === "camel").length;

  if (camelCount > 0) {
    moves.push({ type: "TAKE_CAMELS", payload: {} });
  }

  // 3. PEGAR UMA CARTA
  if (player.hand.length < 7) {
    gameState.market.forEach((card, index) => {
      if (card !== "camel") {
        moves.push({ type: "TAKE_ONE", payload: { marketIndex: index } });
      }
    });
  }

  // 4. TROCAR CARTAS
  const marketGoods = gameState.market
    .map((type, index) => ({ type, index }))
    .filter((card) => card.type !== "camel");

  const handCards = player.hand.map((type, index) => ({ type, index }));
  const herdCount = player.herd.length;
  const maxTrade = Math.min(marketGoods.length, handCards.length + herdCount);

  for (let amount = 2; amount <= maxTrade; amount++) {
    const marketCombos = combinations(marketGoods, amount);

    for (const marketCombo of marketCombos) {
      const takeTypes = marketCombo.map((card) => card.type);
      const takeIndices = marketCombo.map((card) => card.index);
      const takeTypeSet = new Set(takeTypes);

      for (
        let handGiveCount = 0;
        handGiveCount <= Math.min(amount, handCards.length);
        handGiveCount++
      ) {
        const camelsToGive = amount - handGiveCount;
        if (camelsToGive > herdCount) continue;

        const handCombos = combinations(handCards, handGiveCount);

        for (const handCombo of handCombos) {
          const givesSameType = handCombo.some((card) =>
            takeTypeSet.has(card.type),
          );

          if (givesSameType) continue;

          const newHandSize = player.hand.length - handGiveCount + amount;
          if (newHandSize > 7) continue;

          moves.push({
            type: "TAKE_SEVERAL",
            payload: {
              marketIndices: takeIndices,
              handIndices: handCombo.map((card) => card.index),
              herdCount: camelsToGive,
            },
          });
        }
      }
    }
  }

  return uniqueMoves(moves);
}

// ==========================================
// SIMULAÇÃO DE JOGADAS
// ==========================================

function applyMove(gameState, playerId, move) {
  const state = cloneState(gameState);
  const player = state.players[playerId];

  if (!player) return state;

  if (move.type === "SELL_GOODS") {
    const sortedIndices = [...move.payload.handIndices].sort((a, b) => b - a);
    const soldCards = sortedIndices.map((index) => player.hand[index]);
    const sellType = soldCards[0];
    const amountSold = soldCards.length;

    for (const index of sortedIndices) {
      const [card] = player.hand.splice(index, 1);
      state.discardPile.push(card);
    }

    for (let i = 0; i < amountSold; i++) {
      if (state.tokens[sellType] && state.tokens[sellType].length > 0) {
        player.tokens.push(state.tokens[sellType].shift());
      }
    }

    if (amountSold >= 3) {
      const bonusPileName = getBonusPileName(amountSold);

      if (
        state.tokens[bonusPileName] &&
        state.tokens[bonusPileName].length > 0
      ) {
        player.tokens.push(state.tokens[bonusPileName].shift());
      }
    }
  }

  if (move.type === "TAKE_ONE") {
    const { marketIndex } = move.payload;
    const [card] = state.market.splice(marketIndex, 1);
    player.hand.push(card);
    refillMarket(state);
  }

  if (move.type === "TAKE_CAMELS") {
    const camelCount = state.market.filter((card) => card === "camel").length;

    for (let i = 0; i < camelCount; i++) {
      player.herd.push("camel");
    }

    state.market = state.market.filter((card) => card !== "camel");
    refillMarket(state);
  }

  if (move.type === "TAKE_SEVERAL") {
    const { marketIndices, handIndices, herdCount } = move.payload;

    const cardsGiven = [];
    const sortedHandIndices = [...handIndices].sort((a, b) => b - a);

    for (const index of sortedHandIndices) {
      const [card] = player.hand.splice(index, 1);
      cardsGiven.push(card);
    }

    for (let i = 0; i < herdCount; i++) {
      const camel = player.herd.pop();
      if (camel) cardsGiven.push("camel");
    }

    const cardsTaken = [];
    const sortedMarketIndices = [...marketIndices].sort((a, b) => b - a);

    for (const index of sortedMarketIndices) {
      const [card] = state.market.splice(index, 1);
      cardsTaken.push(card);
    }

    player.hand.push(...cardsTaken);
    state.market.push(...cardsGiven);
  }

  return state;
}

// ==========================================
// AVALIAÇÃO DE ESTADO
// ==========================================

function evaluateState(gameState, botId = BOT_ID) {
  const bot = gameState.players[botId];
  const oppId = getOpponentId(gameState, botId);
  const opp = gameState.players[oppId];

  if (!bot || !opp) return -999999;

  if (isRoundEnding(gameState)) {
    const { stats, winnerId } = getRoundScores(gameState);
    const pointDiff = stats[botId].rupees - stats[oppId].rupees;

    return pointDiff * 200 + (winnerId === botId ? 100000 : -100000);
  }

  const botPoints = sumTokens(bot);
  const oppPoints = sumTokens(opp);
  const pointDiff = botPoints - oppPoints;

  const botHandPotential = getBestPossibleSaleValue(gameState, bot.hand, true);
  const oppHandPotential = getBestPossibleSaleValue(gameState, opp.hand, true);

  const botCounts = countCards(bot.hand);
  const oppCounts = countCards(opp.hand);

  let score = 0;

  // Pontos já garantidos valem muito.
  score += pointDiff * 12;

  // Potencial da mão: o Mestre joga vendo a mão real do adversário.
  score += botHandPotential * 5.5;
  score -= oppHandPotential * 7.5;

  // Camelos e ficha de maior rebanho.
  const camelLead = bot.herd.length - opp.herd.length;

  score += camelLead * 4;

  if (bot.herd.length > opp.herd.length) score += 9;
  if (opp.herd.length > bot.herd.length) score -= 12;

  // Espaço na mão é valioso, mas mão cheia pode obrigar venda boa.
  score += (7 - bot.hand.length) * 1.5;
  score -= (7 - opp.hand.length) * 0.8;

  // Prioriza formar conjuntos grandes, especialmente de luxo.
  for (const type of GOODS) {
    const botCount = botCounts[type] || 0;
    const oppCount = oppCounts[type] || 0;
    const top = getTopTokenValue(gameState, type);
    const marketCount = getMarketCount(gameState, type);

    if (LUXURY.includes(type)) {
      if (botCount >= 2) score += 18 + top * 2;
      if (botCount >= 3) score += 15;
      if (oppCount >= 2) score -= 30 + top * 2;
      if (oppCount === 1 && marketCount > 0) score -= 18;
    } else {
      if (botCount >= 3) score += 15 + getExpectedBonus(botCount, gameState);
      if (botCount >= 4) score += 18;
      if (botCount >= 5) score += 25;
      if (oppCount >= 3) score -= 25 + getExpectedBonus(oppCount, gameState);
    }

    // Valor de negar carta do mercado ao adversário.
    if (oppCount >= 2 && marketCount > 0) score -= marketCount * 10;
    if (botCount >= 2 && marketCount > 0) score += marketCount * 8;
  }

  // Controle do fim da rodada.
  const emptyStacks = getEmptyTokenStackCount(gameState);

  if (emptyStacks >= 2) {
    if (pointDiff + botHandPotential >= oppHandPotential) score += 40;
    else score -= 50;
  }

  if (gameState.deck.length <= 6) {
    if (pointDiff > 0) score += 35;
    else score -= 35;
  }

  return score;
}

// ==========================================
// AVALIADOR RÁPIDO PARA FÁCIL / MÉDIO E ORDENAÇÃO
// ==========================================

function evaluateMoveSimple(gameState, move, difficulty, playerId = BOT_ID) {
  const player = gameState.players[playerId];
  const oppId = getOpponentId(gameState, playerId);
  const opp = gameState.players[oppId];

  let score = 0;

  if (move.type === "SELL_GOODS") {
    const count = move.payload.handIndices.length;
    const goodType = player.hand[move.payload.handIndices[0]];
    const isLuxury = LUXURY.includes(goodType);

    score = getSaleValue(
      gameState,
      goodType,
      count,
      difficulty === "Mestre do Souq",
    );

    if (difficulty === "Comerciante distraído") {
      if (count < 3 && !isLuxury) score -= 10;
      if (isLuxury) score += 7;
      if (count >= 4) score += 5;
    } else {
      if (isLuxury) score += 15;
      if (count < 3 && !isLuxury) score -= 25;
      if (count >= 4) score += 15;

      if (gameState.market.includes(goodType) && player.hand.length < 7) {
        score -= 12;
      }
    }
  }

  if (move.type === "TAKE_ONE") {
    const type = gameState.market[move.payload.marketIndex];
    const isLuxury = LUXURY.includes(type);
    const val = getTopTokenValue(gameState, type);
    const alreadyHas = player.hand.filter((c) => c === type).length;
    const oppHas = opp.hand.filter((c) => c === type).length;

    score = val * 1.5 + alreadyHas * 5;

    if (isLuxury) score += 12;
    if (difficulty !== "Comerciante distraído" && oppHas >= 2) score += 18;
  }

  if (move.type === "TAKE_SEVERAL") {
    let gained = 0;
    let lost = 0;
    let luxuryCount = 0;

    move.payload.marketIndices.forEach((idx) => {
      const type = gameState.market[idx];
      gained += getTopTokenValue(gameState, type);
      if (LUXURY.includes(type)) luxuryCount++;
    });

    move.payload.handIndices.forEach((idx) => {
      lost += getTopTokenValue(gameState, player.hand[idx]);
    });

    lost += move.payload.herdCount * 1.3;
    score = (gained - lost) * 2 + luxuryCount * 10;

    if (score <= 0) score -= 20;
  }

  if (move.type === "TAKE_CAMELS") {
    const camelCount = gameState.market.filter((c) => c === "camel").length;

    score = camelCount * 2;

    if (player.herd.length === 0) score += 8;

    if (
      difficulty !== "Comerciante distraído" &&
      opp.hand.length >= 6 &&
      camelCount >= 2
    ) {
      score += 15;
    }
  }

  return score;
}

function orderMovesForSearch(gameState, moves, playerId) {
  return [...moves].sort((a, b) => {
    const aState = applyMove(gameState, playerId, a);
    const bState = applyMove(gameState, playerId, b);

    return evaluateState(bState, BOT_ID) - evaluateState(aState, BOT_ID);
  });
}

// ==========================================
// MINIMAX DO MESTRE DO SOUQ
// ==========================================

function minimax(gameState, depth, playerId, alpha, beta) {
  if (depth <= 0 || isRoundEnding(gameState)) {
    return evaluateState(gameState, BOT_ID);
  }

  const moves = getValidMoves(gameState, playerId);

  if (moves.length === 0) {
    return evaluateState(gameState, BOT_ID);
  }

  const isBotTurn = playerId === BOT_ID;
  const nextPlayerId = getOpponentId(gameState, playerId);

  // Limite para manter o bot rápido, mas ainda muito forte.
  const orderedMoves = orderMovesForSearch(gameState, moves, playerId).slice(
    0,
    18,
  );

  if (isBotTurn) {
    let best = -Infinity;

    for (const move of orderedMoves) {
      const nextState = applyMove(gameState, playerId, move);
      const value = minimax(nextState, depth - 1, nextPlayerId, alpha, beta);

      best = Math.max(best, value);
      alpha = Math.max(alpha, best);

      if (beta <= alpha) break;
    }

    return best;
  }

  let best = Infinity;

  for (const move of orderedMoves) {
    const nextState = applyMove(gameState, playerId, move);
    const value = minimax(nextState, depth - 1, nextPlayerId, alpha, beta);

    best = Math.min(best, value);
    beta = Math.min(beta, best);

    if (beta <= alpha) break;
  }

  return best;
}

function calculateMasterAction(gameState) {
  const moves = getValidMoves(gameState, BOT_ID);

  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  const orderedMoves = orderMovesForSearch(gameState, moves, BOT_ID).slice(
    0,
    24,
  );

  for (const move of orderedMoves) {
    const nextState = applyMove(gameState, BOT_ID, move);
    const oppId = getOpponentId(gameState, BOT_ID);

    // Profundidade 3 = CPU joga, humano responde, CPU planeja de novo.
    let score = minimax(nextState, 3, oppId, -Infinity, Infinity);

    // Bônus tático imediato para ações muito fortes.
    score += evaluateMoveSimple(gameState, move, "Mestre do Souq", BOT_ID) * 3;

    // Se a jogada termina a rodada ganhando, é prioridade absoluta.
    if (isRoundEnding(nextState)) {
      const { winnerId } = getRoundScores(nextState);
      score += winnerId === BOT_ID ? 1000000 : -1000000;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// ==========================================
// EXECUÇÃO DO TURNO
// ==========================================

function calculateBotAction(gameState, difficulty) {
  const moves = getValidMoves(gameState, BOT_ID);

  if (moves.length === 0) return null;

  if (difficulty === "Mestre do Souq") {
    return calculateMasterAction(gameState);
  }

  let bestMove = moves[0];
  let bestScore = -999999;

  for (const move of moves) {
    let score = evaluateMoveSimple(gameState, move, difficulty, BOT_ID);

    if (difficulty === "Comerciante distraído") {
      score += Math.random() * 8;
    } else if (difficulty === "Mercador Experiente") {
      score += Math.random() * 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function executeBotTurn(roomId, gameState, difficulty, processActionFunc) {
  const delay = difficulty === "Mestre do Souq" ? 1200 : 4000;

  setTimeout(() => {
    const action = calculateBotAction(gameState, difficulty);

    if (action) {
      processActionFunc(roomId, BOT_ID, action);
    }
  }, delay);
}

module.exports = { executeBotTurn };
