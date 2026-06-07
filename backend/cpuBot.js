// backend/cpuBot.js

// ==========================================
// CPU BOT - ROTA DOS CAMELOS
// ==========================================
// Fácil: joga simples.
// Médio: joga razoavelmente.
// Mestre do Souq:
// - prioridade máxima para diamante/ouro/prata no mercado;
// - busca formar grupos próprios de 4 e 5;
// - bloqueia grupos de 4 e 5 do jogador;
// - vende luxo no fim da rodada;
// - evita pegar camelos quando isso abre cartas boas para o jogador;
// - joga entre 3 e 10 segundos.
// ==========================================

const BOT_ID = "CPU";

const GOODS = ["diamond", "gold", "silver", "cloth", "spice", "leather"];
const LUXURY = ["diamond", "gold", "silver"];
const COMMON_GOODS = ["cloth", "spice", "leather"];

function isLuxury(type) {
  return LUXURY.includes(type);
}

function isCommonGood(type) {
  return COMMON_GOODS.includes(type);
}

function getOpponentId(gameState) {
  return Object.keys(gameState.players).find((id) => id !== BOT_ID);
}

function getOpponent(gameState) {
  const oppId = getOpponentId(gameState);
  return gameState.players[oppId];
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

function countCards(cards) {
  const counts = {};

  cards.forEach((card) => {
    counts[card] = (counts[card] || 0) + 1;
  });

  return counts;
}

function countInArray(cards, type) {
  return cards.filter((card) => card === type).length;
}

function getBonusPileName(count) {
  if (count === 3) return "bonus3";
  if (count === 4) return "bonus4";
  if (count >= 5) return "bonus5";
  return null;
}

function getExpectedBonus(count) {
  if (count === 3) return 2.5;
  if (count === 4) return 5;
  if (count >= 5) return 9;
  return 0;
}

function getExactBonus(gameState, count) {
  const pileName = getBonusPileName(count);

  if (!pileName) return 0;

  const pile = gameState.tokens[pileName];

  if (pile && pile.length > 0) {
    return pile[0].value || 0;
  }

  return getExpectedBonus(count);
}

function getSalePoints(gameState, type, count, useExactBonus = false) {
  const tokens = gameState.tokens[type] || [];
  let points = 0;

  for (let i = 0; i < count && i < tokens.length; i++) {
    points += tokens[i].value || 0;
  }

  points += useExactBonus
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

function isUrgentEndgame(gameState) {
  return getEmptyStacksCount(gameState) >= 2 || gameState.deck.length <= 10;
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

function botHasSellableLuxury(gameState) {
  const bot = gameState.players[BOT_ID];
  const counts = countCards(bot.hand);

  return LUXURY.some((type) => (counts[type] || 0) >= 2);
}

function getBestImmediateLuxurySale(gameState) {
  const bot = gameState.players[BOT_ID];
  const groupedHand = {};

  bot.hand.forEach((card, index) => {
    if (!groupedHand[card]) groupedHand[card] = [];
    groupedHand[card].push(index);
  });

  let bestMove = null;
  let bestScore = -Infinity;

  for (const type of LUXURY) {
    const indices = groupedHand[type] || [];

    if (indices.length < 2) continue;

    const count = indices.length;
    const points = getSalePoints(gameState, type, count, true);
    const topToken = getTopTokenValue(gameState, type);
    const remainingTokens = getTokenCount(gameState, type);

    let score = points * 100 + topToken * 20;

    if (type === "diamond") score += 300;
    if (type === "gold") score += 220;
    if (type === "silver") score += 150;

    if (remainingTokens <= count) score += 250;
    if (remainingTokens <= 2) score += 150;
    if (count >= 3) score += 120;

    if (score > bestScore) {
      bestScore = score;
      bestMove = {
        type: "SELL_GOODS",
        payload: {
          handIndices: indices.slice(0, count),
        },
      };
    }
  }

  return bestMove;
}

// Quanto vale formar conjunto próprio.
function getOwnSetPriority(type, currentCount, addedCount) {
  if (!isCommonGood(type)) return 0;

  const after = currentCount + addedCount;

  if (after >= 5) return 320;
  if (after === 4) return 220;
  if (after === 3) return 95;
  if (after === 2) return 25;

  return 0;
}

// Quanto vale bloquear conjunto do jogador.
function getOpponentSetThreat(type, opponentCount, cardsRemovedFromMarket = 1) {
  if (!isCommonGood(type)) return 0;

  const wouldHave = opponentCount + cardsRemovedFromMarket;

  // Se o jogador já tem 4, qualquer carta igual no mercado ameaça venda de 5.
  if (opponentCount >= 4) return 260;

  // Se tem 3, uma carta no mercado leva a 4; duas podem levar a 5.
  if (opponentCount === 3) {
    return cardsRemovedFromMarket >= 2 ? 240 : 180;
  }

  // Se tem 2, bloquear 3 é útil, mas não pode superar luxo nem conjunto próprio forte.
  if (opponentCount === 2) {
    return cardsRemovedFromMarket >= 2 ? 120 : 75;
  }

  return 0;
}

// Penalidade por entregar carta que ajuda o jogador.
function getFeedingPenalty(type, opponentCount) {
  if (isLuxury(type)) {
    if (opponentCount >= 2) return 260;
    if (opponentCount === 1) return 180;
    return 90;
  }

  if (isCommonGood(type)) {
    if (opponentCount >= 4) return 240;
    if (opponentCount === 3) return 170;
    if (opponentCount === 2) return 95;
    if (opponentCount === 1) return 35;
  }

  return 0;
}

// ==========================================
// 1. GERADOR DE JOGADAS
// ==========================================

function getValidMoves(gameState, botId) {
  const bot = gameState.players[botId];
  const moves = [];

  if (!bot) return moves;

  // 1. VENDER MERCADORIAS
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
  const camelCount = countInArray(gameState.market, "camel");

  if (camelCount > 0) {
    moves.push({
      type: "TAKE_CAMELS",
      payload: {},
    });
  }

  // 3. PEGAR UMA CARTA
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
  const opp = getOpponent(gameState);

  const botHandCounts = countCards(bot.hand);
  const oppHandCounts = countCards(opp.hand);

  const endgame = isEndgame(gameState);
  const urgentEndgame = isUrgentEndgame(gameState);
  const emptyStacks = getEmptyStacksCount(gameState);
  const hasSellableLuxury = botHasSellableLuxury(gameState);

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
    }

    if (difficulty === "Mercador Experiente") {
      if (luxury) score += 15;
      if (count < 3 && !luxury) score -= 30;
      if (count >= 4) score += 15;

      if (gameState.market.includes(goodType) && bot.hand.length < 7) {
        score -= 15;
      }
    }

    if (difficulty === "Mestre do Souq") {
      const botHas = botHandCounts[goodType] || 0;
      const oppHas = oppHandCounts[goodType] || 0;
      const marketHas = countInArray(gameState.market, goodType);

      score += points * 3;

      if (endgame) score += 80;
      if (urgentEndgame) score += 120;

      if (luxury) {
        score += 90;

        if (count >= 2) score += 120;
        if (count >= 3) score += 180;

        // No fim da rodada, vender luxo é prioridade absoluta.
        if (urgentEndgame) {
          score += 550;
          score += points * 20;
        }

        if (endgame) {
          score += 850;
          score += points * 30;
        }

        if (bot.hand.length >= 6) score += 160;
        if (availableTokens <= count) score += 180;
        if (availableTokens <= 2) score += 120;

        if (oppHas >= 1 && urgentEndgame) score += 140;
        if (oppHas >= 2) score += 220;

        // Só segura luxo para pegar mais se ainda houver bastante jogo.
        if (marketHas > 0 && bot.hand.length < 7 && !urgentEndgame) {
          score -= 80;
        }
      }

      if (!luxury) {
        // Vender comum pequeno é ruim cedo; vender 4/5 é excelente.
        if (count === 1 && !endgame) score -= 90;
        if (count === 2 && !endgame) score -= 55;
        if (count === 3) score += 55;
        if (count === 4) score += 180;
        if (count >= 5) score += 310;

        // Se ainda dá para completar 4/5 com mercado, segura.
        if (marketHas > 0 && bot.hand.length < 7 && count < 5 && !endgame) {
          score -= 80;
        }

        // Se já tem 4, vender 4 é bom; mas se há carta igual no mercado e espaço, tentar 5.
        if (
          botHas === 4 &&
          marketHas > 0 &&
          bot.hand.length < 7 &&
          !urgentEndgame
        ) {
          score -= 50;
        }

        // Se já tem 5, vende.
        if (botHas >= 5) {
          score += 260;
        }
      }

      if (availableTokens <= count) score += 70;
      if (availableTokens <= 2 && getTopTokenValue(gameState, goodType) > 0) {
        score += 40;
      }

      if (availableTokens <= count && emptyStacks >= 2) {
        score += 150;
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
    }

    if (difficulty === "Mercador Experiente") {
      score += botHas * 5;
      if (luxury) score += 10;
    }

    if (difficulty === "Mestre do Souq") {
      score += val * 4;
      score += botHas * 18;

      // Se está no fim e já tem luxo vendável, vender é melhor que pegar mais.
      if (urgentEndgame && hasSellableLuxury) score -= 700;
      if (endgame && hasSellableLuxury) score -= 1100;

      if (luxury && availableTokens > 0) {
        // Prioridade máxima: não deixar luxo no mercado.
        score += 320;

        if (type === "diamond") score += 90;
        if (type === "gold") score += 70;
        if (type === "silver") score += 55;

        if (botHas === 0) score += 35;
        if (botHas === 1) score += 180;
        if (botHas >= 2) score += 80;

        if (oppHas >= 1) score += 150;
        if (oppHas >= 2) score += 250;

        if (availableTokens <= 3) score += 85;
        if (availableTokens <= 2) score += 130;

        // Se no fim ainda não tem luxo vendável e essa carta fecha par,
        // aí sim pode pegar em vez de vender.
        if (urgentEndgame && !hasSellableLuxury && botHas === 1) {
          score += 340;
        }

        // Se já tem par de luxo no fim, não segurar.
        if (urgentEndgame && botHas >= 2) {
          score -= 650;
        }
      }

      if (!luxury) {
        // Formar os próprios grupos de 4/5.
        score += getOwnSetPriority(type, botHas, 1);

        // Bloquear o jogador de formar 4/5.
        score += getOpponentSetThreat(type, oppHas, 1);

        if (botHas >= 2) score += 40;
        if (botHas >= 3) score += 55;

        if (oppHas >= 2) score += 45;
        if (oppHas >= 3) score += 65;

        // Se ele está perto de 4/5, marcar é importante.
        if (oppHas === 3) score += 80;
        if (oppHas >= 4) score += 130;

        // Mas carta comum solta não pode ser melhor que luxo.
        if (botHas === 0 && oppHas < 2 && !endgame) {
          score -= 35;
        }

        if (botHas === 0 && opp.hand.length <= 5 && !endgame) {
          score -= 30;
        }
      }

      if (!luxury && botHas + 1 === 4) score += 110;
      if (!luxury && botHas + 1 >= 5) score += 180;

      if (bot.hand.length >= 6 && !luxury && botHas < 2) {
        score -= 45;
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
    let blockingScore = 0;
    let ownSetScore = 0;

    takenTypes.forEach((type) => {
      const top = getTopTokenValue(gameState, type);
      const alreadyHas = botHandCounts[type] || 0;
      const opponentHas = oppHandCounts[type] || 0;
      const addedCount = takenCounts[type] || 0;
      const afterTake = alreadyHas + addedCount;

      valGained += top;

      if (isLuxury(type)) {
        luxuryTaken++;
        valGained += 45;

        if (afterTake >= 2) completionScore += 190;
        if (afterTake >= 3) completionScore += 120;
      } else {
        ownSetScore += getOwnSetPriority(type, alreadyHas, addedCount);
        blockingScore += getOpponentSetThreat(type, opponentHas, addedCount);

        if (afterTake === 3) completionScore += 70;
        if (afterTake === 4) completionScore += 180;
        if (afterTake >= 5) completionScore += 320;
      }
    });

    givenHandTypes.forEach((type) => {
      const opponentHas = oppHandCounts[type] || 0;
      const givenCount = givenCounts[type] || 0;

      valLost += getTopTokenValue(gameState, type);

      if (isLuxury(type)) {
        luxuryGiven++;
        valLost += 130;
      }

      // Penaliza perder progresso próprio em grupo comum.
      if (isCommonGood(type)) {
        const botHas = botHandCounts[type] || 0;

        if (botHas >= 4) valLost += 170;
        if (botHas === 3) valLost += 90;
        if (botHas === 2) valLost += 35;
      }

      // Penaliza alimentar o oponente.
      feedingScore += getFeedingPenalty(type, opponentHas) * givenCount;
    });

    // Camelo é recurso de troca. Gasta, mas gastar para pegar luxo ou completar 4/5 vale.
    valLost += givenCamelCount * 2.2;

    score = (valGained - valLost) * 3;

    if (luxuryTaken > 0) score += luxuryTaken * 190;
    if (luxuryTaken >= 2) score += 220;
    if (luxuryTaken >= 3) score += 320;

    if (luxuryGiven > 0) score -= luxuryGiven * 300;

    score += completionScore;
    score += ownSetScore;
    score += blockingScore;

    if (
      difficulty === "Mercador Experiente" ||
      difficulty === "Mestre do Souq"
    ) {
      if (score <= 0) score -= 40;
      if (luxuryTaken >= 2) score += 50;
    }

    if (difficulty === "Mestre do Souq") {
      const tradeSize = move.payload.marketIndices.length;

      // Se está no fim e já tem luxo vendável, vender é melhor que trocar.
      if (urgentEndgame && hasSellableLuxury) score -= 500;
      if (endgame && hasSellableLuxury) score -= 900;

      // Trocas grandes são o coração do jogo.
      if (tradeSize === 4) score += 190;
      if (tradeSize >= 5) score += 310;

      // Troca grande usando camelos é ótima.
      if (givenCamelCount >= 2 && tradeSize >= 4) score += 120;
      if (givenCamelCount >= 3 && tradeSize >= 5) score += 170;

      if (luxuryTaken > 0) {
        // Ainda é a maior prioridade.
        score += 180;
      }

      // Se a troca forma grupo próprio 4/5, sobe muito.
      if (ownSetScore >= 220) score += 120;
      if (ownSetScore >= 320) score += 180;

      // Se a troca bloqueia grupo 4/5 do jogador, também sobe.
      if (blockingScore >= 180) score += 90;
      if (blockingScore >= 260) score += 140;

      // Não entregar carta boa ao jogador.
      score -= feedingScore;

      // Evita troca pequena sem luxo, sem grupo próprio e sem bloqueio.
      if (
        luxuryTaken === 0 &&
        ownSetScore < 95 &&
        blockingScore < 75 &&
        completionScore < 70 &&
        tradeSize <= 3
      ) {
        score -= 90;
      }

      if (bot.hand.length >= 6 && tradeSize >= 3) {
        score += 55;
      }

      if (opp.hand.length >= 6 && luxuryTaken > 0) {
        score += 70;
      }

      // No fim, se ainda não tem luxo vendável, pode trocar para formar par de luxo.
      if (urgentEndgame && !hasSellableLuxury && luxuryTaken > 0) {
        score += 220;
      }
    }
  }

  // ==========================================
  // PEGAR CAMELOS
  // ==========================================
  else if (move.type === "TAKE_CAMELS") {
    const camelCount = countInArray(gameState.market, "camel");
    const luxuryInMarket = gameState.market.filter((card) => isLuxury(card));
    const luxuryWithTokensInMarket = luxuryInMarket.filter(
      (type) => getTokenCount(gameState, type) > 0,
    );

    score = camelCount * 1.5;

    if (difficulty === "Comerciante distraído") {
      if (bot.herd.length < 2) score += 6;
      if (camelCount >= 3) score -= 5;
    }

    if (difficulty === "Mercador Experiente") {
      if (bot.herd.length === 0) score += 10;
      if (camelCount >= 3 && bot.herd.length >= 4) score -= 15;
    }

    if (difficulty === "Mestre do Souq") {
      const revealedCards = getNextRevealedCards(gameState, camelCount);
      const revealedLuxury = revealedCards.filter((card) => isLuxury(card));
      const revealedUsefulToOpponent = revealedCards.filter(
        (card) => (oppHandCounts[card] || 0) >= 1,
      );

      // Se está no fim e já tem luxo vendável, vender é prioridade.
      if (urgentEndgame && hasSellableLuxury) score -= 850;
      if (endgame && hasSellableLuxury) score -= 1200;

      // Nunca pegar camelo deixando luxo no mercado.
      if (luxuryWithTokensInMarket.length > 0) {
        score -= 650;
      }

      if (camelCount === 1) {
        score -= 80;
      }

      // Camelos são importantes para trocas de 4/5.
      if (camelCount >= 2 && bot.herd.length <= 2) {
        score += 75;
      }

      if (camelCount >= 3) {
        score += 90;
      }

      if (bot.herd.length === 0) {
        score += 55;
      }

      if (bot.herd.length >= 5 && !endgame) {
        score -= 45;
      }

      // Se o jogador está sem espaço, pegar camelos é menos perigoso.
      if (opp.hand.length >= 7 && camelCount >= 2) {
        score += 170;
      } else if (opp.hand.length >= 6 && camelCount >= 2) {
        score += 95;
      }

      // Se limpar camelos revela luxo para o jogador, é péssimo.
      if (revealedLuxury.length > 0 && opp.hand.length < 7) {
        score -= 220 * revealedLuxury.length;
      }

      // Se revela carta que o jogador junta, também é ruim.
      if (revealedUsefulToOpponent.length > 0 && opp.hand.length < 7) {
        revealedUsefulToOpponent.forEach((type) => {
          const oppHas = oppHandCounts[type] || 0;
          score -= isLuxury(type) ? 200 : getOpponentSetThreat(type, oppHas, 1);
        });
      }

      // Bônus de maior rebanho.
      if (bot.herd.length + camelCount > opp.herd.length) {
        score += 35;
      }

      if (endgame && bot.herd.length + camelCount > opp.herd.length) {
        score += 95;
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

  // REGRA DE OURO DO MESTRE:
  // Se o fim está próximo e o bot tem diamante/ouro/prata vendável,
  // ele vende imediatamente. Isso evita perder segurando luxo.
  if (difficulty === "Mestre do Souq" && isUrgentEndgame(gameState)) {
    const luxurySale = getBestImmediateLuxurySale(gameState);

    if (luxurySale) {
      return luxurySale;
    }
  }

  let bestMove = moves[0];
  let bestScore = -999999;

  for (const move of moves) {
    let score = evaluateMove(gameState, move, difficulty);

    if (difficulty === "Comerciante distraído") {
      score += Math.random() * 3;
    } else if (difficulty === "Mercador Experiente") {
      score += Math.random() * 0.1;
    } else {
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
