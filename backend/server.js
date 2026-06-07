const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const {
  initializeGame,
  resetGameForNewRound,
  handleTakeOne,
  handleTakeCamels,
  handleTakeSeveral,
  handleSellGoods,
  checkRoundEnd,
  processRoundEnd,
} = require("./gameLogic");
const { executeBotTurn } = require("./cpuBot");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const rooms = {};

// ==========================================
// FILTRAGEM DO ESTADO
// ==========================================
function getFilteredState(gameState, playerId) {
  if (!gameState) return null;
  const stateCopy = JSON.parse(JSON.stringify(gameState));
  const opponentId = Object.keys(stateCopy.players).find(
    (id) => id !== playerId,
  );

  if (opponentId && stateCopy.players[opponentId]) {
    stateCopy.players[opponentId].handCount =
      stateCopy.players[opponentId].hand.length;
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

const countItems = (arr) => {
  const counts = {};
  arr.forEach((item) => (counts[item] = (counts[item] || 0) + 1));
  return Object.entries(counts)
    .map(([name, qty]) => `${qty} ${name}`)
    .join(" e ");
};

// ==========================================
// MOTOR CENTRAL (HUMANOS E CPU USAM ISTO)
// ==========================================
function processAction(roomId, playerId, actionData, socket = null) {
  const room = rooms[roomId];
  if (!room || !room.gameState || room.gameState.currentTurn !== playerId) {
    if (socket) socket.emit("errorMsg", "Não é o seu turno!");
    return;
  }

  const playerName =
    playerId === room.players.host ? room.names.host : room.names.challenger;
  const pt = {
    diamond: "Diamante(s)",
    gold: "Ouro(s)",
    silver: "Prata(s)",
    cloth: "Tecido(s)",
    spice: "Especiaria(s)",
    leather: "Couro(s)",
    camel: "Camelo(s)",
  };

  try {
    let logMsg = "";

    if (actionData.type === "TAKE_ONE") {
      const card = room.gameState.market[actionData.payload.marketIndex];
      logMsg = `${playerName} pegou 1 ${pt[card]} do mercado.`;
      handleTakeOne(room.gameState, playerId, actionData.payload);
    } else if (actionData.type === "TAKE_SEVERAL") {
      const takenNames = actionData.payload.marketIndices.map(
        (i) => pt[room.gameState.market[i]],
      );
      const givenNames = actionData.payload.handIndices.map(
        (i) => pt[room.gameState.players[playerId].hand[i]],
      );
      for (let i = 0; i < actionData.payload.herdCount; i++)
        givenNames.push("Camelo(s)");

      logMsg = `${playerName} trocou ${countItems(givenNames)} por ${countItems(takenNames)}.`;
      handleTakeSeveral(room.gameState, playerId, actionData.payload);
    } else if (actionData.type === "TAKE_CAMELS") {
      const camelsCount = room.gameState.market.filter(
        (c) => c === "camel",
      ).length;
      logMsg = `${playerName} pegou ${camelsCount} Camelo(s) do mercado.`;
      handleTakeCamels(room.gameState, playerId);
    } else if (actionData.type === "SELL_GOODS") {
      const count = actionData.payload.handIndices.length;
      const cardType =
        room.gameState.players[playerId].hand[
          actionData.payload.handIndices[0]
        ];
      logMsg = `${playerName} vendeu ${count} ${pt[cardType]}.`;
      handleSellGoods(room.gameState, playerId, actionData.payload);
    } else {
      throw new Error("Ação inválida.");
    }

    room.gameState.logs.unshift(logMsg);
    if (room.gameState.logs.length > 8) room.gameState.logs.pop();

    if (checkRoundEnd(room.gameState)) {
      room.gameState.roundEndStats = processRoundEnd(
        room.gameState,
        room.players.host,
        room.players.challenger,
      );
      room.gameState.currentTurn = null;
    } else {
      room.gameState.currentTurn = Object.keys(room.gameState.players).find(
        (id) => id !== playerId,
      );
    }

    if (room.players.host) {
      io.to(room.players.host).emit(
        "updateGameState",
        getFilteredState(room.gameState, room.players.host),
      );
    }
    if (room.players.challenger && room.players.challenger !== "CPU") {
      io.to(room.players.challenger).emit(
        "updateGameState",
        getFilteredState(room.gameState, room.players.challenger),
      );
    }

    if (room.gameState.currentTurn === "CPU" && !room.gameState.roundEndStats) {
      executeBotTurn(roomId, room.gameState, room.cpuDifficulty, processAction);
    }
  } catch (error) {
    if (socket) {
      socket.emit("errorMsg", error.message);
    } else {
      console.error(`[CRASH CPU Sala ${roomId}]:`, error.message);
    }
  }
}

// ==========================================
// SOCKET.IO - GESTÃO DE SALAS E EVENTOS
// ==========================================
io.on("connection", (socket) => {
  socket.on("createRoom", ({ roomId, playerName }) => {
    if (Object.keys(rooms).length >= 5)
      return socket.emit("errorMsg", "Servidor cheio (Máx 5 salas).");
    if (!rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId] = {
        players: { host: socket.id, challenger: null },
        names: { host: playerName, challenger: null },
        gameState: null,
      };
      socket.emit("roomCreated", roomId);
    }
  });

  socket.on("createRoomVsCPU", ({ roomId, playerName, difficulty }) => {
    if (Object.keys(rooms).length >= 5)
      return socket.emit("errorMsg", "Servidor cheio (Máx 5 salas).");
    socket.join(roomId);
    rooms[roomId] = {
      players: { host: socket.id, challenger: "CPU" },
      names: { host: playerName, challenger: "🤖 " + difficulty },
      gameState: null,
      isCPUGame: true,
      cpuDifficulty: difficulty,
    };
    const room = rooms[roomId];
    room.gameState = initializeGame(room.players.host, room.players.challenger);
    room.gameState.players[room.players.host].name = room.names.host;
    room.gameState.players[room.players.challenger].name =
      room.names.challenger;
    socket.emit("gameReady", "Começou contra a CPU!");
    socket.emit(
      "updateGameState",
      getFilteredState(room.gameState, room.players.host),
    );
  });

  socket.on("joinRoom", ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit("errorMsg", "Sala não encontrada.");
    const normName = playerName.trim().toLowerCase();
    const hostName = room.names.host
      ? room.names.host.trim().toLowerCase()
      : "";
    const chalName = room.names.challenger
      ? room.names.challenger.trim().toLowerCase()
      : "";

    const handleReconnect = (role) => {
      const oldId = room.players[role];
      const newId = socket.id;
      room.players[role] = newId;
      socket.join(roomId);
      if (room.gameState && oldId && oldId !== newId) {
        room.gameState.players[newId] = room.gameState.players[oldId];
        delete room.gameState.players[oldId];
        if (room.gameState.currentTurn === oldId)
          room.gameState.currentTurn = newId;
      }
      if (room.gameState) {
        io.to(newId).emit(
          "updateGameState",
          getFilteredState(room.gameState, newId),
        );
      }
      io.to(roomId).emit("gameReady", "Reconectado!");
    };

    if (hostName === normName) return handleReconnect("host");
    if (chalName === normName) return handleReconnect("challenger");

    if (!room.players.challenger) {
      socket.join(roomId);
      room.players.challenger = socket.id;
      room.names.challenger = playerName;
      room.gameState = initializeGame(
        room.players.host,
        room.players.challenger,
      );
      room.gameState.players[room.players.host].name = room.names.host;
      room.gameState.players[room.players.challenger].name =
        room.names.challenger;
      io.to(roomId).emit("gameReady", "Começou!");
      io.to(room.players.host).emit(
        "updateGameState",
        getFilteredState(room.gameState, room.players.host),
      );
      io.to(room.players.challenger).emit(
        "updateGameState",
        getFilteredState(room.gameState, room.players.challenger),
      );
    } else {
      socket.emit("errorMsg", "Esta sala já está cheia.");
    }
  });

  socket.on("playAction", (roomId, actionData) => {
    processAction(roomId, socket.id, actionData, socket);
  });

  socket.on("requestNextRound", (roomId) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || !room.gameState.roundEndStats) return;
    const winnerId = room.gameState.roundEndStats.roundWinnerId;
    const loserId =
      Object.keys(room.gameState.players).find((id) => id !== winnerId) ||
      room.players.host;
    room.gameState.roundEndStats = null;
    room.gameState = resetGameForNewRound(room.gameState, loserId);
    room.gameState.players[room.players.host].name = room.names.host;
    room.gameState.players[room.players.challenger].name =
      room.names.challenger;

    if (room.players.host)
      io.to(room.players.host).emit(
        "updateGameState",
        getFilteredState(room.gameState, room.players.host),
      );
    if (room.players.challenger && room.players.challenger !== "CPU")
      io.to(room.players.challenger).emit(
        "updateGameState",
        getFilteredState(room.gameState, room.players.challenger),
      );
    if (room.gameState.currentTurn === "CPU")
      executeBotTurn(roomId, room.gameState, room.cpuDifficulty, processAction);
  });

  // NOVO: Lida com a saída respeitando o fim de jogo
  socket.on("leaveRoom", (roomId) => {
    const room = rooms[roomId];
    if (room) {
      const isMatchOver = room.gameState?.roundEndStats?.matchWinnerId;

      if (room.players.host === socket.id) room.players.host = null;
      if (room.players.challenger === socket.id) room.players.challenger = null;
      socket.leave(roomId);

      if (isMatchOver) {
        socket.to(roomId).emit("opponentLeftPostGame");
        if (
          !room.players.host &&
          (!room.players.challenger || room.players.challenger === "CPU")
        )
          delete rooms[roomId];
      } else {
        socket.to(roomId).emit("opponentDisconnected");
        delete rooms[roomId];
      }
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (
        room.players.host === socket.id ||
        room.players.challenger === socket.id
      ) {
        const isMatchOver = room.gameState?.roundEndStats?.matchWinnerId;

        if (room.players.host === socket.id) room.players.host = null;
        if (room.players.challenger === socket.id)
          room.players.challenger = null;

        if (isMatchOver) {
          io.to(roomId).emit("opponentLeftPostGame");
          if (
            !room.players.host &&
            (!room.players.challenger || room.players.challenger === "CPU")
          )
            delete rooms[roomId];
        } else {
          io.to(roomId).emit("opponentDisconnected");
          delete rooms[roomId];
        }
      }
    }
    console.log(`Jogador desconectado: ${socket.id}`);
  });
});

app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html")),
);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
