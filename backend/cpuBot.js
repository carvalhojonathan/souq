// backend/cpuBot.js

// ==========================================
// FUNÇÕES AUXILIARES DE LEITURA DA MESA
// ==========================================

const BOT_ID = "CPU";

const GOODS = ["diamond", "gold", "silver", "cloth", "spice", "leather"];
const LUXURY = ["diamond", "gold", "silver"];

function isLuxury(type) {
  return LUXURY.includes(type);
}

function getOpponentId(gameState) {
  return Object.keys(gameState.players).find((id) => id !== BOT_ID);
}

function getTopTokenValue(gameState, type) {
  if (!gameState.tokens[type] || gameState.tokens[type].length === 0) return 0;
  return gameState.tokens[type][0].value || 0;
}

function getTokenCount(gameState, type) {
  if (!gameState.tokens[type] || !Array.isArray(gameState.tokens[type])) {
    return 0;
  }

  return gameState.tokens[type].length;
}

function getExactBonus(gameState, count) {
  const pile =
    count === 3
      ? "bonus3"
      : count === 4
        ? "bonus4"
        : count >= 5
          ? "bonus5"
          : null;

  if (!pile) return 0;

  if (gameState.tokens[pile] && gameState.tokens[pile].length > 0) {
    return gameState.tokens[pile][0].value || 0;
  }

  if (count === 3) return 2.5;
  if (count === 4) return 5;
  if (count >= 5) return 9;

  return 0;
}

function getExpectedBonus(count) {
  if (count === 3) return 2.5;
  if (count === 4) return 5;
  if (count >= 5) return 9;
  return 0;
}

function countInArray(arr, type) {
  return arr.filter((card) => card === type).length;
}

function countCards(arr) {
  const counts = {};

  arr.forEach((card) => {
    counts[card] = (counts[card] || 0) + 1;
  });

  return counts;
}

function getSalePoints(gameState, type, count, exactBonus = false) {
  let points = 0;
  const tokens = gameState.tokens[type] || [];

  for (let i = 0; i < count && i < tokens.length; i++) {
    points += tokens[i].value || 0;
  }

  points += exactBonus
    ? getExactBonus(gameState, count)
    : getExpectedBonus(count);

  return points;
}

function getEmptyStacksCount(gameState) {
  return GOODS.filter((type) => getTokenCount(gameState, type) === 0).length;
}

function isEndgame(gameState) {
  return getEmptyStacksCount(gameState) >= 2 || gameState.deck.length <= 6;
}

function getNextRevealedCards(gameState, amount) {
  const revealed = [];

  for (let i = 0; i < amount; i++) {
    const card = gameState.deck[gameState.deck.length - 1 - i];

    if (card) {
      revealed.push(card);
    }
  }

  return revealed;
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

function getMoveDebugName(gameState, move) {
  if (move.type === "TAKE_ONE") {
    return `pegar ${gameState.market[move.payload.marketIndex]}`;
  }

  if (move.type === "TAKE_CAMELS") {
    return "pegar camelos";
  }

  if (move.type === "SELL_GOODS") {
    const bot = gameState.players[BOT_ID];
    const type = bot.hand[move.payload.handIndices[0]];
    return `vender ${move.payload.handIndices.length} ${type}`;
  }

  if (move.type === "TAKE_SEVERAL") {
    const takes = move.payload.marketIndices.map((i) => gameState.market[i]);
    return `trocar por ${takes.join(", ")}`;
  }

  return move.type;
}

// ==========================================
// 1. GERADOR DE JOGADAS
// ==========================================

function getValidMoves(gameState, botId) {
  const bot = gameState.players[botId];
  const moves = [];

  if (!bot) return moves;

  // 1. VENDER MERCADORIAS
  // Agora gera vendas parciais também.
  // Exemplo: se tiver 5 couros, ele avalia vender 1, 2, 3, 4 ou 5.
  // Para luxo, mínimo continua sendo 2.
  const groupedHand = {};

  bot.hand.forEach((card, index) => {
    if (!groupedHand[card]) groupedHand[card] = [];
    groupedHand[card].push(index);
  });

  for (const [cardType, indices] of Object.entries(groupedHand)) {
    if (cardType === "camel") continue;

    const luxury = isLuxury(cardType);
    const minSell = luxury ? 2 : 1;

    if (indices.length >= minSell) {
      for (let amount = minSell; amount <= indices.length; amount++) {
        moves.push({
          type: "SELL_GOODS",
          payload: {
            handIndices: indices.slice(0, amount),
          },
        });
      }
    }
  }

  // 2. PEGAR CAMELOS
  const camelCount = gameState.market.filter((c) => c === "camel").length;

  if (camelCount > 0) {
    moves.push({
      type: "TAKE_CAMELS",
      payload: {},
    });
  }

  // 3. COMPRAR 1 CARTA
  if (bot.hand.length < 7) {
    gameState.market.forEach((card, index) => {
      if (card !== "camel") {
        moves.push({
          type: "TAKE_ONE",
          payload: {
            marketIndex: index,
          },
        });
      }
    });
  }

  // 4. TROCAR CARTAS
  // Agora gera várias combinações, não só "pegar as maiores fichas".
  // Isso deixa o bot encontrar trocas de 4 e 5, principalmente usando camelos.
  const marketGoods = gameState.market
    .map((type, index) => ({
      type,
      index,
      val: getTopTokenValue(gameState, type),
    }))
    .filter((card) => card.type !== "camel");

  const handCards = bot.hand.map((type, index) => ({
    type,
    index,
    val: getTopTokenValue(gameState, type),
  }));

  const herdCount = bot.herd.length;
  const maxTrade = Math.min(marketGoods.length, handCards.length + herdCount);

  for (let amount = 2; amount <= maxTrade; amount++) {
    const marketCombos = combinations(marketGoods, amount);

    for (const marketCombo of marketCombos) {
      const takeTypes = marketCombo.map((card) => card.type);
      const takeTypeSet = new Set(takeTypes);
      const takeIndices = marketCombo.map((card) => card.index);

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

          const newHandSize = bot.hand.length - handGiveCount + amount;

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
// 2. AVALIADOR DE JOGADAS
// ==========================================

function evaluateMove(gameState, move, difficulty) {
  const bot = gameState.players[BOT_ID];
  const oppId = getOpponentId(gameState);
  const opp = gameState.players[oppId];

  const botHandCounts = countCards(bot.hand);
  const oppHandCounts = countCards(opp.hand);

  const endgame = isEndgame(gameState);
  const emptyTokenStacks = getEmptyStacksCount(gameState);

  let score = 0;

  // ==========================================
  // VENDER MERCADORIAS
  // ==========================================
  if (move.type === "SELL_GOODS") {
    const count = move.payload.handIndices.length;
    const goodType = bot.hand[move.payload.handIndices[0]];
    const luxury = isLuxury(goodType);
    const availableTokens = getTokenCount(gameState, goodType);
    const points = getSalePoints(
      gameState,
      goodType,
      count,
      difficulty === "Mestre do Souq",
    );

    score = points;

    if (difficulty === "Comerciante distraído") {
      if (count < 3 && !luxury) score -= 15;
      if (luxury) score += 10;
      if (count >= 4) score += 8;
    } else if (difficulty === "Mercador Experiente") {
      if (luxury) score += 15;
      if (count < 3 && !luxury) score -= 30;
      if (count >= 4) score += 15;
      if (gameState.market.includes(goodType) && bot.hand.length < 7) {
        score -= 15;
      }
    } else if (difficulty === "Mestre do Souq") {
      const oppHas = oppHandCounts[goodType] || 0;
      const botHas = botHandCounts[goodType] || 0;
      const marketHas = countInArray(gameState.market, goodType);
      const topToken = getTopTokenValue(gameState, goodType);

      score += points * 3;

      if (endgame) {
        score += 70;
      }

      // Luxo: vender pares/trincas é bom, mas se ainda tem a mesma carta no mercado,
      // ele tenta pegar primeiro para vender mais forte.
      if (luxury) {
        score += 45;

        if (count >= 2) score += 25;
        if (count >= 3) score += 35;

        if (marketHas > 0 && bot.hand.length < 7 && !endgame) {
          score -= 75;
        }

        // Se o oponente também tem luxo, vender antes é ótimo.
        if (oppHas >= 2) score += 65;
        if (oppHas >= 1 && availableTokens <= 2) score += 45;
      }

      // Mercadorias comuns: prioriza vendas grandes.
      if (!luxury) {
        if (count === 1 && !endgame) score -= 70;
        if (count === 2 && !endgame) score -= 40;
        if (count === 3) score += 35;
        if (count === 4) score += 95;
        if (count >= 5) score += 150;

        // Se dá para completar 4/5 com algo no mercado, não vende antes.
        if (marketHas > 0 && bot.hand.length < 7 && count < 5 && !endgame) {
          score -= 55;
        }
      }

      // Se a pilha está acabando, vender antes do oponente é muito valioso.
      if (availableTokens <= count) {
        score += 65;
      }

      if (availableTokens <= 2 && topToken > 0) {
        score += 35;
      }

      // Se essa venda esvazia a terceira pilha e o bot já está bem pontuado, força o fim.
      if (availableTokens <= count && emptyTokenStacks >= 2) {
        score += 120;
      }

      // Penaliza vender tudo se ainda daria para buscar bônus maior.
      if (!endgame && !luxury && botHas >= 3 && count < Math.min(5, botHas)) {
        score -= 45;
      }
    }
  }

  // ==========================================
  // PEGAR UMA CARTA
  // ==========================================
  else if (move.type === "TAKE_ONE") {
    const type = gameState.market[move.payload.marketIndex];
    const luxury = isLuxury(type);
    const val = getTopTokenValue(gameState, type);
    const botHas = botHandCounts[type] || 0;
    const oppHas = oppHandCounts[type] || 0;
    const availableTokens = getTokenCount(gameState, type);

    score = val * 1.5;

    if (luxury) score += 8;

    if (difficulty === "Comerciante distraído") {
      score += botHas * 2;
    } else if (difficulty === "Mercador Experiente") {
      score += botHas * 5;
      if (luxury) score += 10;
    } else if (difficulty === "Mestre do Souq") {
      score += val * 4;
      score += botHas * 16;

      if (luxury && availableTokens > 0) {
        // PRIORIDADE ABSOLUTA: não deixar diamante/ouro/prata no mercado.
        score += 220;

        if (type === "diamond") score += 50;
        if (type === "gold") score += 40;
        if (type === "silver") score += 30;

        // Formar par de luxo é uma das jogadas mais importantes.
        if (botHas === 0) score += 30;
        if (botHas === 1) score += 130;
        if (botHas >= 2) score += 70;

        // Bloqueio: se o jogador tem uma carta desse luxo, rouba para não fechar par.
        if (oppHas >= 1) score += 110;
        if (oppHas >= 2) score += 180;

        // Se tem poucas fichas, corre mais ainda.
        if (availableTokens <= 3) score += 60;
        if (availableTokens <= 2) score += 90;
      }

      if (!luxury) {
        if (botHas >= 2) score += 35;
        if (botHas >= 3) score += 45;

        if (oppHas >= 2) score += 45;
        if (oppHas >= 3) score += 70;

        // Evita pegar carta comum solta quando isso só abre carta boa para o jogador.
        if (botHas === 0 && opp.hand.length <= 5 && !endgame) {
          score -= 25;
        }
      }

      // Se pegar a carta completa 4 ou 5, prioridade alta.
      if (!luxury && botHas + 1 === 4) score += 70;
      if (!luxury && botHas + 1 >= 5) score += 110;

      // Se mão vai ficar cheia, só vale se for algo realmente bom.
      if (bot.hand.length >= 6 && !luxury && botHas < 2) {
        score -= 35;
      }
    }
  }

  // ==========================================
  // TROCAR VÁRIAS CARTAS
  // ==========================================
  else if (move.type === "TAKE_SEVERAL") {
    const takenTypes = move.payload.marketIndices.map(
      (idx) => gameState.market[idx],
    );
    const givenHandTypes = move.payload.handIndices.map((idx) => bot.hand[idx]);
    const givenCamelCount = move.payload.herdCount;

    const takenCounts = countCards(takenTypes);
    const givenCounts = countCards(givenHandTypes);

    let valGained = 0;
    let valLost = 0;
    let luxuryTaken = 0;
    let luxuryGiven = 0;
    let feedingScore = 0;
    let completionScore = 0;

    takenTypes.forEach((type) => {
      const top = getTopTokenValue(gameState, type);
      valGained += top;

      if (isLuxury(type)) {
        luxuryTaken++;
        valGained += 25;
      }

      const botAlreadyHas = botHandCounts[type] || 0;
      const afterTake = botAlreadyHas + (takenCounts[type] || 0);

      if (isLuxury(type)) {
        if (afterTake >= 2) completionScore += 130;
        if (afterTake >= 3) completionScore += 70;
      } else {
        if (afterTake === 3) completionScore += 45;
        if (afterTake === 4) completionScore += 115;
        if (afterTake >= 5) completionScore += 180;
      }
    });

    givenHandTypes.forEach((type) => {
      valLost += getTopTokenValue(gameState, type);

      if (isLuxury(type)) {
        luxuryGiven++;
        valLost += 90;
      }

      // Não alimentar o jogador com carta que ele já coleciona.
      if ((oppHandCounts[type] || 0) >= 1) {
        feedingScore += isLuxury(type) ? 120 : 45;
      }

      if ((oppHandCounts[type] || 0) >= 2) {
        feedingScore += isLuxury(type) ? 90 : 55;
      }
    });

    // Camelo é recurso de troca. Gasta, mas gastar para pegar luxo ou completar 4/5 vale.
    valLost += givenCamelCount * 2.2;

    score = (valGained - valLost) * 3;

    if (luxuryTaken > 0) score += luxuryTaken * 140;
    if (luxuryTaken >= 2) score += 140;
    if (luxuryTaken >= 3) score += 220;

    if (luxuryGiven > 0) score -= luxuryGiven * 220;

    score += completionScore;

    if (
      difficulty === "Mercador Experiente" ||
      difficulty === "Mestre do Souq"
    ) {
      if (score <= 0) score -= 40;
      if (luxuryTaken >= 2) score += 40;
    }

    if (difficulty === "Mestre do Souq") {
      const tradeSize = move.payload.marketIndices.length;

      // TROCAS DE 4 E 5 PRECISAM ACONTECER.
      if (tradeSize === 4) score += 140;
      if (tradeSize >= 5) score += 220;

      // Usar camelos para trocas grandes é exatamente o objetivo deles.
      if (givenCamelCount >= 2 && tradeSize >= 4) score += 75;
      if (givenCamelCount >= 3 && tradeSize >= 5) score += 110;

      // Se a troca pega luxo, ela deve superar quase tudo.
      if (
        luxuryTaken > 0 &&
        getTokenCount(gameState, takenTypes.find(isLuxury)) > 0
      ) {
        score += 130;
      }

      // Não dar cartas boas para o jogador.
      score -= feedingScore;

      // Evita trocar só por cartas comuns aleatórias sem formar conjunto.
      if (luxuryTaken === 0 && completionScore < 50 && tradeSize <= 3) {
        score -= 65;
      }

      // Se a mão está cheia, trocar é melhor do que pegar carta comum.
      if (bot.hand.length >= 6 && tradeSize >= 3) {
        score += 40;
      }

      // Se o jogador está com mão cheia, trocar pode controlar o mercado sem dar compra simples.
      if (opp.hand.length >= 6 && luxuryTaken > 0) {
        score += 60;
      }
    }
  }

  // ==========================================
  // PEGAR CAMELOS
  // ==========================================
  else if (move.type === "TAKE_CAMELS") {
    const camelCount = gameState.market.filter((c) => c === "camel").length;
    const luxuryInMarket = gameState.market.filter((c) => isLuxury(c));
    const luxuryWithTokensInMarket = luxuryInMarket.filter(
      (type) => getTokenCount(gameState, type) > 0,
    );

    score = camelCount * 1.5;

    if (difficulty === "Comerciante distraído") {
      if (bot.herd.length < 2) score += 6;
      if (camelCount >= 3) score -= 5;
    } else if (difficulty === "Mercador Experiente") {
      if (bot.herd.length === 0) score += 10;
      if (camelCount >= 3 && bot.herd.length >= 4) score -= 15;
    } else if (difficulty === "Mestre do Souq") {
      const revealedCards = getNextRevealedCards(gameState, camelCount);
      const revealedLuxury = revealedCards.filter((card) => isLuxury(card));
      const revealedUsefulToOpponent = revealedCards.filter(
        (card) => (oppHandCounts[card] || 0) >= 1,
      );

      // NUNCA pegar camelos deixando luxo na mesa, se ele puder pegar/trocar.
      if (luxuryWithTokensInMarket.length > 0) {
        score -= 500;
      }

      // Pegar só 1 camelo raramente é bom.
      if (camelCount === 1) {
        score -= 70;
      }

      // Pegar 2+ camelos é bom quando precisa de moeda para trocas grandes.
      if (camelCount >= 2 && bot.herd.length <= 2) {
        score += 45;
      }

      if (camelCount >= 3) {
        score += 55;
      }

      if (bot.herd.length === 0) {
        score += 40;
      }

      if (bot.herd.length >= 5 && !endgame) {
        score -= 35;
      }

      // Se o jogador está com mão cheia, ele não pode simplesmente pegar carta.
      // Aí limpar camelos é muito menos perigoso.
      if (opp.hand.length >= 7 && camelCount >= 2) {
        score += 120;
      } else if (opp.hand.length >= 6 && camelCount >= 2) {
        score += 70;
      }

      // Se limpar camelos vai revelar luxo e o jogador tem espaço, é péssimo.
      if (revealedLuxury.length > 0 && opp.hand.length < 7) {
        score -= 160 * revealedLuxury.length;
      }

      // Se revelar carta que o jogador coleciona, também é ruim.
      if (revealedUsefulToOpponent.length > 0 && opp.hand.length < 7) {
        score -= 60 * revealedUsefulToOpponent.length;
      }

      // Se o bot está atrás em camelos, pegar ajuda no bônus de 5.
      if (bot.herd.length + camelCount > opp.herd.length) {
        score += 25;
      }

      // No fim do jogo, camelos podem decidir a ficha de rebanho.
      if (endgame && bot.herd.length + camelCount > opp.herd.length) {
        score += 70;
      }
    }
  }

  return score;
}

// ==========================================
// 3. EXECUÇÃO DO TURNO
// ==========================================

function calculateBotAction(gameState, difficulty) {
  const moves = getValidMoves(gameState, BOT_ID);

  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -999999;

  for (const move of moves) {
    let score = evaluateMove(gameState, move, difficulty);

    if (difficulty === "Comerciante distraído") {
      score += Math.random() * 3;
    } else if (difficulty === "Mercador Experiente") {
      score += Math.random() * 0.1;
    } else {
      // Mestre do Souq: praticamente determinístico.
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
  const minDelay = 3000;
  const maxDelay = 10000;
  const delay = Math.floor(
    minDelay + Math.random() * (maxDelay - minDelay + 1),
  );

  setTimeout(() => {
    const action = calculateBotAction(gameState, difficulty);

    if (action) {
      processActionFunc(roomId, BOT_ID, action);
    }
  }, delay);
}

module.exports = { executeBotTurn };
