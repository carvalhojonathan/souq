import React, { useState, useEffect } from "react";
import GameHeader from "./GameHeader";
import PlayerArea from "./PlayerArea";
import MarketArea from "./MarketArea";
import TokenArea from "./TokenArea";
import ActionPanel from "./ActionPanel";
import ActionLog from "./ActionLog";
import RoundEndModal from "./RoundEndModal";
import HelpModal from "./HelpModal";

export default function GameBoard({
  gameState,
  socket,
  roomId,
  opponentConnected,
  onLeaveRoom,
  isDarkMode,
  toggleTheme,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedHandCards, setSelectedHandCards] = useState([]);
  const [selectedMarketCards, setSelectedMarketCards] = useState([]);
  const [selectedHerdCount, setSelectedHerdCount] = useState(0);

  // Estado para controlar se o jogador fechou o modal de fim de jogo para ver a mesa
  const [isReviewingBoard, setIsReviewingBoard] = useState(false);

  useEffect(() => {
    // Quando uma nova rodada começa, reseta o estado de visualização da mesa
    if (!gameState.roundEndStats) {
      setIsReviewingBoard(false);
    }
  }, [gameState.roundEndStats]);

  const myId = socket.id;
  const opponentId = Object.keys(gameState.players).find((id) => id !== myId);
  const myPlayer = gameState.players[myId];
  const opponent = gameState.players[opponentId];
  const isMyTurn = gameState.isMyTurn;

  // Tela de carregamento caso os dados demorem uma fração de segundo a chegar
  if (!myPlayer || !opponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-4xl animate-bounce mb-4">🐪</div>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 font-display animate-pulse">
          Sincronizando partida...
        </h2>
      </div>
    );
  }

  // Alterna a seleção de cartas na mão
  const toggleHandSelection = (index) =>
    setSelectedHandCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );

  // Alterna a seleção de cartas no mercado (com lógica especial para Camelos)
  const toggleMarketSelection = (index) => {
    const clickedCard = gameState.market[index];
    if (clickedCard === "camel") {
      const camelIndices = gameState.market.reduce((acc, card, i) => {
        if (card === "camel") acc.push(i);
        return acc;
      }, []);
      if (selectedMarketCards.includes(index)) {
        setSelectedMarketCards((prev) =>
          prev.filter((i) => !camelIndices.includes(i)),
        );
      } else {
        setSelectedMarketCards((prev) => {
          const others = prev.filter((i) => gameState.market[i] !== "camel");
          return [...others, ...camelIndices];
        });
      }
    } else {
      setSelectedMarketCards((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    }
  };

  const handleNextRound = () => {
    setIsReviewingBoard(false);
    socket.emit("requestNextRound", roomId);
  };

  const handleLeaveMatch = () => {
    socket.emit("leaveRoom", roomId);
    onLeaveRoom();
  };

  return (
    <>
      {/* Modal de Regras */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Modal de Fim de Rodada/Jogo (Escondido se o jogador estiver a ver a mesa) */}
      {gameState.roundEndStats && !isReviewingBoard && (
        <RoundEndModal
          stats={gameState.roundEndStats}
          myId={myId}
          players={gameState.players}
          onNextRound={handleNextRound}
          onLeaveMatch={handleLeaveMatch}
          onReviewBoard={() => setIsReviewingBoard(true)}
        />
      )}

      {/* GRELHA PRINCIPAL DO JOGO */}
      <div className="game-board-container relative">
        {/* CABEÇALHO */}
        <div style={{ gridArea: "header" }}>
          <GameHeader
            opponentConnected={opponentConnected}
            opponentName={opponent.name}
            onOpenHelp={() => setShowHelp(true)}
            onLeaveRoom={onLeaveRoom}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </div>

        {/* PAINEL DE AÇÕES */}
        <div style={{ gridArea: "actions" }}>
          <ActionPanel
            socket={socket}
            roomId={roomId}
            isMyTurn={isMyTurn}
            myPlayer={myPlayer}
            gameState={gameState}
            selectedHand={selectedHandCards.map((idx) => myPlayer.hand[idx])}
            selectedHandIndices={selectedHandCards}
            selectedMarket={selectedMarketCards.map(
              (idx) => gameState.market[idx],
            )}
            selectedMarketIndices={selectedMarketCards}
            selectedHerdCount={selectedHerdCount}
            clearSelection={() => {
              setSelectedHandCards([]);
              setSelectedMarketCards([]);
              setSelectedHerdCount(0);
            }}
            isReviewingBoard={isReviewingBoard}
            matchWinner={gameState.roundEndStats?.matchWinnerId}
            onContinueRound={handleNextRound}
            onLeaveMatch={handleLeaveMatch}
          />
        </div>

        {/* ÁREA DE FICHAS (Sidebar Esquerda no PC) */}
        <div style={{ gridArea: "tokens" }}>
          <TokenArea tokens={gameState.tokens} />
        </div>

        {/* MESA PRINCIPAL */}
        <div
          style={{ gridArea: "board" }}
          className="flex flex-col gap-3 md:gap-4"
        >
          {/* BLOCO UNIFICADO: OPONENTE + HISTÓRICO */}
          <div className="flex flex-col rounded-xl shadow-sm border-2 border-jaipur-red dark:border-red-900/50 overflow-hidden bg-gray-50 dark:bg-gray-800 transition-colors">
            <PlayerArea
              isOpponent={true}
              playerName={opponent.name}
              hand={opponent.handCount}
              herdCount={opponent.herd.length}
              seals={opponent.seals}
              tokens={opponent.tokens}
              className="border-none rounded-none shadow-none" /* Remove as bordas duplas para unificar */
            />
            {/* Histórico "colado" abaixo da mão do oponente */}
            <div className="max-h-24 md:max-h-32 overflow-hidden bg-white dark:bg-gray-900 border-t-2 border-jaipur-red dark:border-red-900/50">
              <ActionLog logs={gameState.logs} />
            </div>
          </div>

          {/* O MERCADO (Ao centro) */}
          <MarketArea
            isMyTurn={isMyTurn}
            marketCards={gameState.market}
            deckCount={gameState.deck.length}
            discardPile={gameState.discardPile}
            selectedMarketCards={selectedMarketCards}
            onSelectCard={toggleMarketSelection}
            className="shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />

          {/* A SUA MÃO (Em baixo) */}
          <PlayerArea
            isOpponent={false}
            isMyTurn={isMyTurn}
            playerName={myPlayer.name}
            hand={myPlayer.hand}
            herdCount={myPlayer.herd.length}
            seals={myPlayer.seals}
            tokens={myPlayer.tokens}
            selectedHandCards={selectedHandCards}
            onSelectCard={toggleHandSelection}
            selectedHerdCount={selectedHerdCount}
            onHerdSelect={setSelectedHerdCount}
            className="shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>
    </>
  );
}
