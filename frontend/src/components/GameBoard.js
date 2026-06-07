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

  const [isReviewingBoard, setIsReviewingBoard] = useState(false);

  useEffect(() => {
    if (!gameState.roundEndStats) {
      setIsReviewingBoard(false);
    }
  }, [gameState.roundEndStats]);

  const myId = socket.id;
  const opponentId = Object.keys(gameState.players).find((id) => id !== myId);
  const myPlayer = gameState.players[myId];
  const opponent = gameState.players[opponentId];
  const isMyTurn = gameState.isMyTurn;

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

  const toggleHandSelection = (index) =>
    setSelectedHandCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );

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
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

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

      <div className="game-board-container relative">
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

        <div style={{ gridArea: "tokens" }}>
          <TokenArea tokens={gameState.tokens} />
        </div>

        {/* MESA PRINCIPAL (A Mão do Jogador primeiro, depois Mercado, depois Oponente) */}
        <div
          style={{ gridArea: "board" }}
          className="flex flex-col gap-3 md:gap-4"
        >
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

          <MarketArea
            isMyTurn={isMyTurn}
            marketCards={gameState.market}
            deckCount={gameState.deck.length}
            discardPile={gameState.discardPile}
            selectedMarketCards={selectedMarketCards}
            onSelectCard={toggleMarketSelection}
            className="shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />

          <PlayerArea
            isOpponent={true}
            playerName={opponent.name}
            hand={opponent.handCount}
            herdCount={opponent.herd.length}
            seals={opponent.seals}
            tokens={opponent.tokens}
            className="shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* HISTÓRICO SEPARADO */}
        <div
          style={{ gridArea: "log" }}
          className="max-h-32 md:max-h-48 overflow-hidden shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200"
        >
          <ActionLog logs={gameState.logs} />
        </div>
      </div>
    </>
  );
}
