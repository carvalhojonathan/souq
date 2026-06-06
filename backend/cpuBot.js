// backend/cpuBot.js

// ==========================================
// FUNÇÕES AUXILIARES DE LEITURA DA MESA
// ==========================================

// O Bot olha para a pilha e vê exatamente qual é o valor da ficha que está no topo!
function getTopTokenValue(gameState, type) {
  if (!gameState.tokens[type] || gameState.tokens[type].length === 0) return 0;
  return gameState.tokens[type][0].value;
}

// O Bot calcula a média esperada se ganhar uma ficha oculta de bónus
function getExpectedBonus(count) {
  if (count === 3) return 2.5; // Média das fichas 1,2,3
  if (count === 4) return 5; // Média das fichas 4,5,6
  if (count >= 5) return 9; // Média das fichas 8,9,10
  return 0;
}

// ==========================================
// 1. GERADOR DE JOGADAS INTELIGENTES
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

  // 4. TROCAR CARTAS (Mestre das Trocas: Dar o Lixo para levar o Ouro)
  // O bot analisa o mercado do MAIS VALIOSO para o MENOS VALIOSO
  const marketCards = gameState.market
    .map((type, index) => ({
      type,
      index,
      val: getTopTokenValue(gameState, type),
    }))
    .filter((c) => c.type !== "camel")
    .sort((a, b) => b.val - a.val);

  // O bot analisa a sua mão do LIXO (menos valioso) para o MELHOR
  const handCards = bot.hand
    .map((type, index) => ({
      type,
      index,
      val: getTopTokenValue(gameState, type),
    }))
    .sort((a, b) => a.val - b.val);

  const herdCount = bot.herd.length;
  const maxTrade = Math.min(marketCards.length, handCards.length + herdCount);

  // Gera possibilidades de trocar 2 a 5 mercadorias
  if (maxTrade >= 2) {
    for (let k = 2; k <= maxTrade; k++) {
      const takeIndices = marketCards.slice(0, k).map((c) => c.index);
      const takeTypes = marketCards.slice(0, k).map((c) => c.type);

      const giveHandIndices = [];
      let camelsToGive = 0;
      let itemsGathered = 0;

      // Impede o bot de entregar um tipo de mercadoria que ele está a tentar receber
      const validHandCards = handCards.filter(
        (c) => !takeTypes.includes(c.type),
      );

      // 1º Tenta dar as piores cartas da mão
      for (const hc of validHandCards) {
        if (itemsGathered < k) {
          giveHandIndices.push(hc.index);
          itemsGathered++;
        }
      }

      // 2º Se faltar para a troca, completa com camelos do rebanho
      while (itemsGathered < k && camelsToGive < herdCount) {
        camelsToGive++;
        itemsGathered++;
      }

      // A troca só é válida se tiver os K itens e a mão final não estourar 7 cartas
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
  let score = 0;

  if (move.type === "SELL_GOODS") {
    const count = move.payload.handIndices.length;
    const goodType = bot.hand[move.payload.handIndices[0]];
    const isLuxury = ["diamond", "gold", "silver"].includes(goodType);

    // Soma os exatos pontos reais que vai tirar da mesa + estimativa do bónus
    let points = 0;
    const tokens = gameState.tokens[goodType] || [];
    for (let i = 0; i < count && i < tokens.length; i++)
      points += tokens[i].value;
    points += getExpectedBonus(count);

    score = points;

    // FÁCIL (Aplicada a Lógica do Antigo Normal)
    if (difficulty === "Comerciante distraído") {
      if (count >= 3) score += 5;
      if (isLuxury) score += 6;
    }
    // NORMAL (Aplicada a Lógica do Antigo Difícil)
    else if (difficulty === "Mercador Experiente") {
      if (count < 3 && !isLuxury) score -= 15; // Odeia vender pouco
      if (isLuxury) score += 10;
      if (count >= 4) score += 8;
    }
    // DIFÍCIL (A Nova Máquina Mortífera)
    else if (difficulty === "Mestre do Souq") {
      if (isLuxury) score += 15; // Obsessão absoluta por luxo
      if (count < 3 && !isLuxury) score -= 30; // Nunca vende couro/tecido solto
      if (count >= 4) score += 15; // Procura ativamente os maiores bónus

      // Mestre vê o futuro: Se houver a mesma carta no mercado, ele prefere pegar mais do que vender o que já tem.
      if (gameState.market.includes(goodType) && bot.hand.length < 7) {
        score -= 15;
      }
    }
  } else if (move.type === "TAKE_ONE") {
    const type = gameState.market[move.payload.marketIndex];
    const isLuxury = ["diamond", "gold", "silver"].includes(type);
    const val = getTopTokenValue(gameState, type);

    score = val * 1.5; // Multiplicador base

    // GLOBAL: Todos priorizam Diamante, Ouro e Prata brutalmente
    if (isLuxury) score += 8;

    if (difficulty === "Mercador Experiente") {
      // Normal já tenta fazer pequenos pares
      score += bot.hand.filter((c) => c === type).length * 2;
    } else if (difficulty === "Mestre do Souq") {
      // Mestre vê que tem 2 tecidos, se vir 1 no mercado a pontuação explode para fazer trinca
      score += bot.hand.filter((c) => c === type).length * 5;
      if (isLuxury) score += 10;
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
    valLost += move.payload.herdCount * 1.5; // O camelo tem um peso tático de ~1.5 pontos

    // Se o valor ganho for muito maior que o perdido, o score explode
    score = (valGained - valLost) * 2;

    // GLOBAL: Trocas que envolvam roubar luxo da mesa ganham prioridade absurda
    if (luxuryCount > 0) score += 12;

    if (difficulty === "Mestre do Souq") {
      if (score <= 0) score -= 50; // O Mestre NUNCA faz uma troca onde perca valor matemático
      if (luxuryCount >= 2) score += 20; // Troca de sonho (Ex: 2 camelos por Ouro+Diamante)
    }
  } else if (move.type === "TAKE_CAMELS") {
    const camelCount = gameState.market.filter((c) => c === "camel").length;
    score = camelCount * 1.5;

    if (difficulty === "Mercador Experiente") {
      if (bot.herd.length < 2) score += 6; // Pega se precisar de moeda de troca
      if (camelCount >= 3) score -= 5; // Evita abrir o mercado dando 3 cartas grátis
    } else if (difficulty === "Mestre do Souq") {
      if (bot.herd.length === 0) score += 10; // Sem camelos não há boas trocas
      // Se ele já tiver o prêmio final dos camelos garantido e o mercado tiver muitos, ignora-os!
      if (camelCount >= 3 && bot.herd.length >= 4) score -= 15;
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

    // Randomização inversamente proporcional à dificuldade para evitar comportamentos 100% robóticos
    if (difficulty === "Comerciante distraído") {
      score += Math.random() * 8; // Ocasionalmente faz um erro parvo
    } else if (difficulty === "Mercador Experiente") {
      score += Math.random() * 3; // Erra quase nunca
    } else {
      score += Math.random() * 0.1; // Mestre do Souq é calculista e implacável
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function executeBotTurn(roomId, gameState, difficulty, processActionFunc) {
  console.log(`🤖 [CPU] A pensar na sala ${roomId}... Nível: ${difficulty}`);

  setTimeout(() => {
    const action = calculateBotAction(gameState, difficulty);

    if (action) {
      console.log(`🤖 [CPU] Decidiu jogar: ${action.type}`);
      processActionFunc(roomId, "CPU", action);
    }
  }, 5000);
}

module.exports = { executeBotTurn };
