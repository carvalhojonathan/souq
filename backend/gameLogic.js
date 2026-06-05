// =========================================================================
// UTILITÁRIOS E INICIALIZAÇÃO
// =========================================================================

// Função para embaralhar arrays (Algoritmo de Fisher-Yates)
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Cria o deck de 55 cartas (já subtraindo os 3 camelos que vão direto pro mercado)
function createDeck() {
  let deck = [];
  const counts = {
    diamond: 6,
    gold: 6,
    silver: 6,
    cloth: 8,
    spice: 8,
    leather: 10,
    camel: 8, // 11 no total - 3 do mercado inicial
  };

  for (const [type, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      deck.push(type);
    }
  }
  return shuffleArray(deck);
}

// Embaralha e cria as fichas de bônus
function createBonusTokens() {
  const bonus3 = shuffleArray([1, 1, 2, 2, 2, 3, 3]);
  const bonus4 = shuffleArray([4, 4, 5, 5, 6, 6]);
  const bonus5 = shuffleArray([8, 8, 9, 10, 10]);

  return { bonus3, bonus4, bonus5 };
}

// Inicializa o estado do jogo do zero
function initializeGame(hostId, challengerId) {
  let deck = createDeck();

  // 1. O mercado começa com 3 camelos
  let market = ["camel", "camel", "camel"];

  // 2. Distribuir 5 cartas para cada jogador
  let hostHand = deck.splice(0, 5);
  let challengerHand = deck.splice(0, 5);

  // 3. Remover camelos da mão e colocar no rebanho
  let hostHerd = hostHand.filter((card) => card === "camel");
  hostHand = hostHand.filter((card) => card !== "camel");

  let challengerHerd = challengerHand.filter((card) => card === "camel");
  challengerHand = challengerHand.filter((card) => card !== "camel");

  // 4. Completar o mercado com 2 cartas do deck
  market.push(deck.pop(), deck.pop());

  const bonusTokens = createBonusTokens();

  // Helper para mapear valores puros em objetos de fichas
  const mapGoods = (arr) => arr.map((v) => ({ type: "good", value: v }));
  const mapBonus = (arr) => arr.map((v) => ({ type: "bonus", value: v }));

  return {
    market: market,
    deck: deck,
    discardPile: [],
    tokens: {
      diamond: mapGoods([7, 7, 5, 5, 5]),
      gold: mapGoods([6, 6, 5, 5, 5]),
      silver: mapGoods([5, 5, 5, 5, 5]),
      cloth: mapGoods([5, 3, 3, 2, 1, 1]),
      spice: mapGoods([5, 3, 3, 2, 1, 1]),
      leather: mapGoods([4, 3, 2, 1, 1, 1, 1, 1, 1]),
      bonus3: mapBonus(bonusTokens.bonus3),
      bonus4: mapBonus(bonusTokens.bonus4),
      bonus5: mapBonus(bonusTokens.bonus5),
      camelToken: 1,
    },
    players: {
      [hostId]: {
        id: hostId,
        hand: hostHand,
        herd: hostHerd,
        tokens: [],
        seals: 0,
      },
      [challengerId]: {
        id: challengerId,
        hand: challengerHand,
        herd: challengerHerd,
        tokens: [],
        seals: 0,
      },
    },
    currentTurn: hostId, // O anfitrião sempre começa a primeira rodada
    logs: ["A partida começou!"],
  };
}

// Reseta o jogo para a próxima rodada preservando os selos de excelência
function resetGameForNewRound(oldGameState, loserId) {
  const playerIds = Object.keys(oldGameState.players);
  const hostId = playerIds[0];
  const challengerId = playerIds[1];

  const newGameState = initializeGame(hostId, challengerId);

  // Restaura os selos
  newGameState.players[hostId].seals = oldGameState.players[hostId].seals;
  newGameState.players[challengerId].seals =
    oldGameState.players[challengerId].seals;

  // Perdedor da rodada anterior começa
  newGameState.currentTurn = loserId;
  newGameState.logs = ["Uma nova rodada começou!"];

  return newGameState;
}

// =========================================================================
// AÇÕES DOS JOGADORES
// =========================================================================

// Função auxiliar para reabastecer o mercado
function refillMarket(gameState) {
  while (gameState.market.length < 5 && gameState.deck.length > 0) {
    gameState.market.push(gameState.deck.pop());
  }
}

// 1. PEGAR UMA ÚNICA MERCADORIA
function handleTakeOne(gameState, playerId, payload) {
  const { marketIndex } = payload;
  const player = gameState.players[playerId];
  const cardToTake = gameState.market[marketIndex];

  if (player.hand.length >= 7) throw new Error("Limite de 7 cartas excedido.");
  if (cardToTake === "camel")
    throw new Error("Para pegar camelos, use a ação de Pegar Camelos.");

  gameState.market.splice(marketIndex, 1);
  player.hand.push(cardToTake);

  refillMarket(gameState);
}

// 2. PEGAR CAMELOS
function handleTakeCamels(gameState, playerId) {
  const player = gameState.players[playerId];

  const camelIndices = gameState.market
    .map((card, index) => (card === "camel" ? index : -1))
    .filter((index) => index !== -1);

  if (camelIndices.length === 0) throw new Error("Não há camelos no mercado.");

  for (let i = 0; i < camelIndices.length; i++) {
    player.herd.push("camel");
  }

  gameState.market = gameState.market.filter((card) => card !== "camel");
  refillMarket(gameState);
}

// 3. PEGAR VÁRIAS MERCADORIAS (TROCA)
function handleTakeSeveral(gameState, playerId, payload) {
  const { marketIndices, handIndices, herdCount } = payload;
  const player = gameState.players[playerId];

  const totalGiven = handIndices.length + herdCount;
  const totalTaken = marketIndices.length;

  if (totalGiven !== totalTaken)
    throw new Error("A troca deve ser pelo mesmo número de cartas.");
  if (totalTaken < 2)
    throw new Error("Uma troca envolve pelo menos duas cartas.");
  if (player.hand.length - handIndices.length + totalTaken > 7)
    throw new Error("Limite de mão excedido.");

  const cardsGiven = [];
  const sortedHandIndices = [...handIndices].sort((a, b) => b - a);

  for (let index of sortedHandIndices) {
    cardsGiven.push(player.hand[index]);
    player.hand.splice(index, 1);
  }

  for (let i = 0; i < herdCount; i++) {
    cardsGiven.push("camel");
    player.herd.pop();
  }

  const cardsTaken = [];
  const sortedMarketIndices = [...marketIndices].sort((a, b) => b - a);

  for (let index of sortedMarketIndices) {
    cardsTaken.push(gameState.market[index]);
    gameState.market.splice(index, 1);
  }

  const hasCommon = cardsGiven.some((card) => cardsTaken.includes(card));
  if (hasCommon)
    throw new Error(
      "Você não pode entregar e levar o mesmo tipo de mercadoria.",
    );

  player.hand.push(...cardsTaken);
  gameState.market.push(...cardsGiven);
}

// 4. VENDER MERCADORIAS
function handleSellGoods(gameState, playerId, payload) {
  const { handIndices } = payload;
  const player = gameState.players[playerId];

  if (!handIndices || handIndices.length === 0)
    throw new Error("Nenhuma carta selecionada.");

  const cardsToSell = handIndices.map((index) => player.hand[index]);
  const sellType = cardsToSell[0];

  const isAllSameType = cardsToSell.every((card) => card === sellType);
  if (!isAllSameType)
    throw new Error("Você só pode vender um tipo de mercadoria por vez.");
  if (sellType === "camel")
    throw new Error("Você não pode vender camelos, apenas trocá-los.");

  const isLuxuryItem = ["diamond", "gold", "silver"].includes(sellType);
  if (isLuxuryItem && handIndices.length < 2) {
    throw new Error(
      `Ao vender ${sellType}, a venda deve incluir no mínimo duas cartas.`,
    );
  }

  // Remover da mão para o descarte
  const sortedIndices = [...handIndices].sort((a, b) => b - a);
  for (let index of sortedIndices) {
    gameState.discardPile.push(player.hand.splice(index, 1)[0]);
  }

  const amountSold = cardsToSell.length;

  // Fichas de mercadoria
  for (let i = 0; i < amountSold; i++) {
    if (gameState.tokens[sellType].length > 0) {
      player.tokens.push(gameState.tokens[sellType].shift());
    }
  }

  // Fichas de Bônus (3 ou mais)
  if (amountSold >= 3) {
    let bonusPileName =
      amountSold === 3 ? "bonus3" : amountSold === 4 ? "bonus4" : "bonus5";
    if (
      gameState.tokens[bonusPileName] &&
      gameState.tokens[bonusPileName].length > 0
    ) {
      player.tokens.push(gameState.tokens[bonusPileName].shift());
    }
  }
}

// =========================================================================
// LÓGICAS DE FIM DE RODADA E PONTUAÇÃO
// =========================================================================

// Checa se as condições de fim de rodada foram atingidas
function checkRoundEnd(gameState) {
  if (gameState.deck.length === 0 && gameState.market.length < 5) return true;

  const goodsTypes = ["diamond", "gold", "silver", "cloth", "spice", "leather"];
  let emptyCount = 0;

  for (const type of goodsTypes) {
    if (gameState.tokens[type].length === 0) emptyCount++;
  }

  return emptyCount >= 3;
}

// Calcula os pontos e gerencia os selos de excelência
function processRoundEnd(gameState, hostId, challengerId) {
  const host = gameState.players[hostId];
  const challenger = gameState.players[challengerId];

  let hostStats = {
    rupees: 0,
    hasCamelBonus: false,
    bonusTokensCount: 0,
    goodsTokensCount: 0,
  };
  let challengerStats = {
    rupees: 0,
    hasCamelBonus: false,
    bonusTokensCount: 0,
    goodsTokensCount: 0,
  };

  // Ficha de Camelo (Vale 5)
  if (host.herd.length > challenger.herd.length) {
    hostStats.rupees += 5;
    hostStats.hasCamelBonus = true;
    gameState.tokens.camelToken = 0;
  } else if (challenger.herd.length > host.herd.length) {
    challengerStats.rupees += 5;
    challengerStats.hasCamelBonus = true;
    gameState.tokens.camelToken = 0;
  }

  // Riqueza e Contagem de Desempate
  host.tokens.forEach((token) => {
    hostStats.rupees += token.value;
    if (token.type === "bonus") hostStats.bonusTokensCount++;
    if (token.type === "good") hostStats.goodsTokensCount++;
  });

  challenger.tokens.forEach((token) => {
    challengerStats.rupees += token.value;
    if (token.type === "bonus") challengerStats.bonusTokensCount++;
    if (token.type === "good") challengerStats.goodsTokensCount++;
  });

  // Desempates
  let roundWinnerId = null;

  if (hostStats.rupees > challengerStats.rupees) roundWinnerId = hostId;
  else if (challengerStats.rupees > hostStats.rupees)
    roundWinnerId = challengerId;
  else {
    if (hostStats.bonusTokensCount > challengerStats.bonusTokensCount)
      roundWinnerId = hostId;
    else if (challengerStats.bonusTokensCount > hostStats.bonusTokensCount)
      roundWinnerId = challengerId;
    else {
      if (hostStats.goodsTokensCount > challengerStats.goodsTokensCount)
        roundWinnerId = hostId;
      else if (challengerStats.goodsTokensCount > hostStats.goodsTokensCount)
        roundWinnerId = challengerId;
      else roundWinnerId = hostId; // PREVENÇÃO DE CRASH: Em caso de empate idêntico e total, atribuir vitória por padrão.
    }
  }

  // Selo de Excelência
  gameState.players[roundWinnerId].seals += 1;
  const isGameOver = gameState.players[roundWinnerId].seals >= 2;

  return {
    roundWinnerId,
    matchWinnerId: isGameOver ? roundWinnerId : null, // Mapeado para o Modal exibir o campeão final
    scores: {
      // Estrutura exata de pontos que o seu Modal espera ler!
      [hostId]: hostStats.rupees,
      [challengerId]: challengerStats.rupees,
    },
    stats: {
      [hostId]: hostStats,
      [challengerId]: challengerStats,
    },
  };
}

module.exports = {
  initializeGame,
  resetGameForNewRound,
  handleTakeOne,
  handleTakeCamels,
  handleTakeSeveral,
  handleSellGoods,
  checkRoundEnd,
  processRoundEnd,
};
