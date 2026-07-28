const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.io com tolerância a quedas de conexão móvel (Celular)
const io = new Server(server, {
  pingTimeout: 30000,
  pingInterval: 10000
});

app.use(express.static(__dirname));

const rooms = {};
const disconnectTimers = {};

const palavrasPadrao = [
  { id: 1, nome: "Abstrato 1", imageUrl: "cartas/carta_1.png" },
  { id: 2, nome: "Abstrato 2", imageUrl: "cartas/carta_2.png" },
  { id: 3, nome: "Abstrato 3", imageUrl: "cartas/carta_3.png" },
  { id: 4, nome: "Abstrato 4", imageUrl: "cartas/carta_4.png" },
  { id: 5, nome: "Abstrato 5", imageUrl: "cartas/carta_5.png" },
  { id: 6, nome: "Abstrato 6", imageUrl: "cartas/carta_6.png" },
  { id: 7, nome: "Abstrato 7", imageUrl: "cartas/carta_7.png" },
  { id: 8, nome: "Abstrato 8", imageUrl: "cartas/carta_8.png" },
  { id: 9, nome: "Abstrato 9", imageUrl: "cartas/carta_9.png" },
  { id: 10, nome: "Abstrato 10", imageUrl: "cartas/carta_10.png" },
  { id: 11, nome: "Abstrato 11", imageUrl: "cartas/carta_11.png" },
  { id: 12, nome: "Abstrato 12", imageUrl: "cartas/carta_12.png" },
  { id: 13, nome: "Abstrato 13", imageUrl: "cartas/carta_13.png" },
  { id: 14, nome: "Abstrato 14", imageUrl: "cartas/carta_14.png" },
  { id: 15, nome: "Abstrato 15", imageUrl: "cartas/carta_15.png" },
  { id: 16, nome: "Abstrato 16", imageUrl: "cartas/carta_16.png" },
  { id: 17, nome: "Abstrato 17", imageUrl: "cartas/carta_17.png" },
  { id: 18, nome: "Abstrato 18", imageUrl: "cartas/carta_18.png" },
  { id: 19, nome: "Abstrato 19", imageUrl: "cartas/carta_19.png" },
  { id: 20, nome: "Abstrato 20", imageUrl: "cartas/carta_20.png" },
  { id: 21, nome: "Abstrato 21", imageUrl: "cartas/carta_21.png" },
  { id: 22, nome: "Abstrato 22", imageUrl: "cartas/carta_22.png" },
  { id: 23, nome: "Abstrato 23", imageUrl: "cartas/carta_23.png" },
  { id: 24, nome: "Abstrato 24", imageUrl: "cartas/carta_24.png" },
  { id: 25, nome: "Abstrato 25", imageUrl: "cartas/carta_25.png" }
];

function gerarTabuleiro(gameMode) {
  let embaralhadas = [...palavrasPadrao].sort(() => Math.random() - 0.5).slice(0, 20);
  let tipos = [];
  for(let i=0; i<7; i++) tipos.push('azul');
  for(let i=0; i<7; i++) tipos.push('amarelo');
  for(let i=0; i<5; i++) tipos.push('branca');
  tipos.push('preta');

  tipos.sort(() => Math.random() - 0.5);

  return embaralhadas.map((carta, index) => ({
    id: carta.id,
    nome: carta.nome,
    imageUrl: carta.imageUrl,
    type: tipos[index],
    revealed: false
  }));
}

function broadcastPublicRooms() {
  const publicRooms = [];
  for (let rId in rooms) {
    if (!rooms[rId].isPrivate && rooms[rId].status === 'waiting') {
      publicRooms.push({
        id: rId,
        creatorName: rooms[rId].creatorName || 'Agente',
        gameMode: rooms[rId].gameMode,
        isPrivate: rooms[rId].isPrivate,
        playersCount: rooms[rId].players.length,
        maxPlayers: rooms[rId].gameMode === 'dupla' ? 2 : 4
      });
    }
  }
  io.emit('public_rooms_list', publicRooms);
}

io.on('connection', (socket) => {
  socket.on('get_public_rooms', () => {
    broadcastPublicRooms();
  });

  socket.on('get_room_slots', ({ roomId }) => {
    if (rooms[roomId]) {
      const max = rooms[roomId].gameMode === 'dupla' ? 2 : 4;
      socket.emit('room_slots_info', {
        occupiedSlots: rooms[roomId].players.map(p => ({ team: p.team, role: p.role })),
        isFull: rooms[roomId].players.length >= max,
        isPrivate: rooms[roomId].isPrivate,
        gameMode: rooms[roomId].gameMode
      });
    } else {
      socket.emit('room_slots_info', { occupiedSlots: [], isFull: false, isPrivate: false });
    }
  });

  socket.on('join_room', (data) => {
    const { roomId, playerName, gameMode, team, role, avatarId, isPrivate, password } = data;

    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        gameMode: gameMode || 'dupla',
        isPrivate: !!isPrivate,
        password: password || '',
        creatorName: playerName,
        status: 'waiting',
        players: [],
        cards: gerarTabuleiro(gameMode),
        currentTurn: 'azul',
        activeClue: null,
        clicksRemaining: 0,
        jokenpoChoices: {}
      };
    }

    const room = rooms[roomId];

    if (room.isPrivate && room.password && room.password !== password) {
      socket.emit('error_message', 'Senha incorreta para esta sala fechada!');
      return;
    }

    const maxP = room.gameMode === 'dupla' ? 2 : 4;
    if (room.players.length >= maxP) {
      socket.emit('error_message', 'Esta sala já está cheia!');
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = playerName;

    room.players.push({
      id: socket.id,
      name: playerName,
      team: room.gameMode === 'dupla' ? 'azul' : team,
      role: role,
      avatarId: avatarId || 1
    });

    socket.emit('init_state', { room });
    io.to(roomId).emit('update_players', room.players);
    broadcastPublicRooms();

    if (room.status === 'waiting' && room.players.length === maxP) {
      if (room.gameMode === 'confronto') {
        room.status = 'jokenpo';
        io.to(roomId).emit('start_jokenpo_phase', { room });
      } else {
        room.status = 'playing';
        io.to(roomId).emit('game_ready', { room });
        io.to(roomId).emit('log_message', `🎯 Partida iniciada na sala <strong>${roomId}</strong>!`);
      }
    }
  });

  socket.on('send_jokenpo_choice', ({ roomId, choice }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.jokenpoChoices[socket.id] = choice;
    const observadores = room.players.filter(p => p.role === 'observador');

    if (Object.keys(room.jokenpoChoices).length >= observadores.length) {
      const [p1, p2] = observadores;
      const c1 = room.jokenpoChoices[p1.id];
      const c2 = room.jokenpoChoices[p2.id];

      if (c1 === c2) {
        room.jokenpoChoices = {};
        io.to(roomId).emit('jokenpo_draw');
      } else {
        let winner = p1;
        if ((c1 === 'pedra' && c2 === 'papel') || (c1 === 'papel' && c2 === 'tesoura') || (c1 === 'tesoura' && c2 === 'pedra')) {
          winner = p2;
        }
        room.jokenpoWinner = winner;
        io.to(roomId).emit('jokenpo_result', { winnerTeam: winner.team, winnerName: winner.name });
      }
    }
  });

  socket.on('choose_starter_team', ({ roomId, starterTeam }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.currentTurn = starterTeam;
    room.status = 'playing';
    io.to(roomId).emit('game_ready', { room });
    io.to(roomId).emit('log_message', `⚔️ O time <strong>${starterTeam.toUpperCase()}</strong> começa jogando com vantagem!`);
  });

  socket.on('send_clue', ({ roomId, playerName, team, word, number }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.activeClue = { word, number: parseInt(number) };
    room.clicksRemaining = parseInt(number) + 1;

    io.to(roomId).emit('clue_updated', { clue: room.activeClue, clicksRemaining: room.clicksRemaining });
    io.to(roomId).emit('log_message', `💡 <strong>${playerName}</strong> enviou a dica: <strong>"${word}"</strong> (${number})`);
  });

  socket.on('click_card', ({ roomId, cardId, playerName, team }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;

    const card = room.cards.find(c => c.id === cardId);
    if (!card || card.revealed) return;

    card.revealed = true;
    io.to(roomId).emit('card_revealed', { cardId: card.id, type: card.type, clicksRemaining: room.clicksRemaining });
    io.to(roomId).emit('log_message', `🔍 <strong>${playerName}</strong> revelou a carta <strong>${card.nome}</strong> (${card.type.toUpperCase()})`);

    if (room.gameMode === 'dupla') {
      if (card.type === 'azul') {
        room.clicksRemaining--;
        const azulRestantes = room.cards.filter(c => c.type === 'azul' && !c.revealed).length;
        if (azulRestantes === 0) {
          room.status = 'game_over';
          io.to(roomId).emit('game_over', { winner: 'jogadores' });
        } else if (room.clicksRemaining <= 0) {
          room.activeClue = null;
          io.to(roomId).emit('turn_changed', { currentTurn: 'azul' });
        }
      } else if (card.type === 'amarelo') {
        room.activeClue = null;
        room.clicksRemaining = 0;
        io.to(roomId).emit('turn_changed', { currentTurn: 'azul' });
      } else if (card.type === 'preta') {
        room.status = 'game_over';
        io.to(roomId).emit('game_over', { winner: 'sistema' });
      } else {
        room.activeClue = null;
        room.clicksRemaining = 0;
        io.to(roomId).emit('turn_changed', { currentTurn: 'azul' });
      }
    } else {
      const isMyTeamCard = (card.type === room.currentTurn);
      if (isMyTeamCard) {
        room.clicksRemaining--;
        const teamRestantes = room.cards.filter(c => c.type === room.currentTurn && !c.revealed).length;
        if (teamRestantes === 0) {
          room.status = 'game_over';
          io.to(roomId).emit('game_over', { winner: room.currentTurn });
        } else if (room.clicksRemaining <= 0) {
          room.currentTurn = room.currentTurn === 'azul' ? 'amarelo' : 'azul';
          room.activeClue = null;
          io.to(roomId).emit('turn_changed', { currentTurn: room.currentTurn });
        }
      } else {
        if (card.type === 'preta') {
          const winner = room.currentTurn === 'azul' ? 'amarelo' : 'azul';
          room.status = 'game_over';
          io.to(roomId).emit('game_over', { winner });
        } else {
          room.currentTurn = room.currentTurn === 'azul' ? 'amarelo' : 'azul';
          room.activeClue = null;
          io.to(roomId).emit('turn_changed', { currentTurn: room.currentTurn });
        }
      }
    }
  });

  socket.on('restart_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.cards = gerarTabuleiro(room.gameMode);
    room.status = 'playing';
    room.activeClue = null;
    room.clicksRemaining = 0;
    io.to(roomId).emit('game_ready', { room });
    io.to(roomId).emit('log_message', `🔄 Partida reiniciada na sala <strong>${roomId}</strong>!`);
  });

  socket.on('leave_room', ({ roomId }) => {
    removerJogadorDaSala(socket, roomId);
  });

  socket.on('disconnect', () => {
    if (socket.roomId && socket.playerName) {
      disconnectTimers[socket.id] = setTimeout(() => {
        removerJogadorDaSala(socket, socket.roomId);
      }, 5000);
    }
  });
});

function removerJogadorDaSala(socket, roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.players = room.players.filter(p => p.id !== socket.id);
  socket.leave(roomId);

  if (room.players.length === 0) {
    delete rooms[roomId];
  } else {
    room.status = 'waiting';
    io.to(roomId).emit('update_players', room.players);
    io.to(roomId).emit('room_waiting_state', { room });
    io.to(roomId).emit('log_message', `🚪 Um agente saiu da sala.`);
  }
  broadcastPublicRooms();
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});