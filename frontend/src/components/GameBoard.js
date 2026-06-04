import React, { useState } from "react";
import GameHeader from "./GameHeader";
import PlayerArea from "./PlayerArea";
import MarketArea from "./MarketArea";
import TokenArea from "./TokenArea";
import ActionPanel from "./ActionPanel";
import ActionLog from "./ActionLog";
import ScoreBoard from "./ScoreBoard";
import RoundEndModal from "./RoundEndModal";
import HelpModal from "./HelpModal";

export default function GameBoard({
  gameState,
  socket,
  roomId,
  opponentConnected,
  onLeaveRoom,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedHandCards, setSelectedHandCards] = useState([]);
  const [selectedMarketCards, setSelectedMarketCards] = useState([]);
  const [selectedHerdCount, setSelectedHerdCount] = useState(0);

  const myId = socket.id;
  const opponentId = Object.keys(gameState.players).find((id) => id !== myId);
  const myPlayer = gameState.players[myId];
  const opponent = gameState.players[opponentId];
  const isMyTurn = gameState.isMyTurn;

  // TRAVA DE SEGURANÇA: Evita que a tela quebre durante o milissegundo em que a página atualiza
  // e o novo ID de socket ainda está sendo processado pelo servidor.
  if (!myPlayer || !opponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-4xl animate-bounce mb-4">🐪</div>
        <h2 className="text-xl font-bold text-gray-700 font-display animate-pulse">
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

  const handleNextRound = () => socket.emit("requestNextRound", roomId);

  return (
    <>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {gameState.roundEndStats && (
        <RoundEndModal
          stats={gameState.roundEndStats}
          myId={myId}
          onNextRound={handleNextRound}
        />
      )}

      <div className="game-board-container relative">
        <div style={{ gridArea: "header" }}>
          <GameHeader
            roomId={roomId}
            opponentConnected={opponentConnected}
            onOpenHelp={() => setShowHelp(true)}
            onLeaveRoom={onLeaveRoom}
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
          />
        </div>

        <div style={{ gridArea: "tokens" }}>
          <TokenArea tokens={gameState.tokens} />
        </div>

        <div style={{ gridArea: "board" }} className="flex flex-col">
          <PlayerArea
            isOpponent={false}
            isMyTurn={isMyTurn}
            playerName={myPlayer.name}
            hand={myPlayer.hand}
            herdCount={myPlayer.herd.length}
            seals={myPlayer.seals}
            selectedHandCards={selectedHandCards}
            onSelectCard={toggleHandSelection}
            selectedHerdCount={selectedHerdCount}
            onHerdSelect={setSelectedHerdCount}
            className="rounded-b-none border-b-0 z-10"
          />

          <MarketArea
            isMyTurn={isMyTurn}
            marketCards={gameState.market}
            deckCount={gameState.deck.length}
            discardPile={gameState.discardPile}
            selectedMarketCards={selectedMarketCards}
            onSelectCard={toggleMarketSelection}
            className="rounded-none -mt-px z-0"
          />

          <PlayerArea
            isOpponent={true}
            playerName={opponent.name}
            hand={opponent.handCount}
            herdCount={opponent.herd.length}
            seals={opponent.seals}
            className="rounded-t-none border-t-0 -mt-px z-10"
          />
        </div>

        <div style={{ gridArea: "scoreboard" }}>
          <ScoreBoard myPlayer={myPlayer} opponent={opponent} />
        </div>

        <div style={{ gridArea: "log" }}>
          <ActionLog logs={gameState.logs} />
        </div>
      </div>
    </>
  );
}
