function getFilteredState(gameState, playerId) {
  if (!gameState) return null;
  const stateCopy = JSON.parse(JSON.stringify(gameState));
  const opponentId = Object.keys(stateCopy.players).find(
    (id) => id !== playerId,
  );

  if (opponentId && stateCopy.players[opponentId]) {
    // CORREÇÃO ANTI-CRASH: Envia SEMPRE o handCount, independentemente de ser fim de rodada
    stateCopy.players[opponentId].handCount =
      stateCopy.players[opponentId].hand.length;

    // Só apaga as cartas do oponente se a rodada AINDA NÃO acabou
    if (!stateCopy.roundEndStats) {
      delete stateCopy.players[opponentId].hand;
    }
  }

  if (Array.isArray(stateCopy.tokens.bonus3))
    stateCopy.tokens.bonus3 = stateCopy.tokens.bonus3.length;
  if (Array.isArray(stateCopy.tokens.bonus4))
    stateCopy.tokens.bonus4 = stateCopy.tokens.bonus4.length;
  if (Array.isArray(stateCopy.tokens.bonus5))
    stateCopy.tokens.bonus5 = stateCopy.tokens.bonus5.length;
  stateCopy.isMyTurn = stateCopy.currentTurn === playerId;
  return stateCopy;
}
