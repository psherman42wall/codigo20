const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const BANCO_DE_CARTAS = require('./public/cartas.js');
const rooms = {};

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Gera o tabuleiro equilibrado conforme o time que começa
function createNewGame(starterTeam) {
  const starterCardsCount = 8;
  const secondCardsCount = 7;
  const neutralCardsCount = 4;
  const bombCardsCount = 1;

  let types = [];
  if (starterTeam === 'azul') {
    types = [
      ...Array(starterCardsCount).fill('azul'),
      ...Array(secondCardsCount).fill('amarelo'),
      ...Array(neutralCardsCount).fill('branca'),
      ...Array(bombCardsCount).fill('preta')
    ];
  } else {
    types = [
      ...Array(starterCardsCount).fill('amarelo'),
      ...Array(secondCardsCount).fill('azul'),
      ...Array(neutralCardsCount).fill('branca'),
      ...Array(bombCardsCount).fill('preta')
    ];
  }

  const shuffledTypes = shuffle(types);
  const cartasLocais = shuffle([...BANCO_DE_CARTAS]).slice(0, 20);

  return cartasLocais.map((cartaInfo, index) => ({
    id: index,
    nome: cartaInfo.nome,
    type: shuffledTypes[index],
    revealed: false,
    tags: cartaInfo.tags,
    imageUrl: cartaInfo.url
  }));
}

function broadcastRoomsList() {
  const roomsList = Object.values(rooms).map(r => ({
    id: r.id,
    creatorName: r.creatorName || "Agente",
    playersCount: r.players.length,
    maxPlayers: r.gameMode === 'dupla' ? 2 : 4,
    gameMode: r.gameMode || 'dupla',
    isPrivate: r.isPrivate
  }));

  io.emit('public_rooms_list', roomsList);
}

io.on('connection', (socket) => {
  broadcastRoomsList();

  socket.on('get_public_rooms', () => broadcastRoomsList());

  socket.on('get_room_slots', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('room_slots_info', { occupiedSlots: [], isFull: false, isPrivate: false, gameMode: null });
    } else {
      const occupiedSlots = room.players.map(p => ({ team: p.team, role: p.role }));
      const maxP = room.gameMode === 'dupla' ? 2 : 4;
      socket.emit('room_slots_info', { occupiedSlots, isFull: room.players.length >= maxP, isPrivate: room.isPrivate, gameMode: room.gameMode });
    }
  });

  socket.on('join_room', ({ roomId, playerName, gameMode, team, role, avatarId, isPrivate, password }) => {
    let room = rooms[roomId];

    if (!room) {
      rooms[roomId] = {
        id: roomId,
        creatorName: playerName,
        gameMode: gameMode || 'dupla',
        status: 'waiting', // waiting, jokenpo, choice, playing
        cards: [],
        currentTurn: null,
        activeClue: null,
        clicksRemaining: 0,
        players: [],
        isPrivate: isPrivate || false,
        password: password || "",
        jokenpo: { azul: null, amarelo: null }
      };
      room = rooms[roomId];
    } else {
      if (room.isPrivate && room.password && room.password !== password) {
        socket.emit('error_message', 'Senha incorreta!');
        return;
      }

      const maxP = room.gameMode === 'dupla' ? 2 : 4;

      if (room.gameMode === 'dupla') {
        if (room.players.some(p => p.role === role && p.id !== socket.id)) {
          socket.emit('error_message', `A vaga de ${role.toUpperCase()} já está ocupada!`);
          return;
        }
      } else {
        if (room.players.some(p => p.team === team && p.role === role && p.id !== socket.id)) {
          socket.emit('error_message', `A vaga de ${role.toUpperCase()} do Time ${team.toUpperCase()} já está ocupada!`);
          return;
        }
      }

      if (!room.players.some(p => p.id === socket.id) && room.players.length >= maxP) {
        socket.emit('error_message', `A sala já está cheia (${maxP}/${maxP})!`);
        return;
      }
    }

    socket.join(roomId);

    room.players = room.players.filter(p => p.id !== socket.id);
    room.players.push({
      id: socket.id,
      name: playerName,
      team: room.gameMode === 'dupla' ? 'azul' : (team || 'azul'),
      role,
      avatarId
    });

    const maxPlayers = room.gameMode === 'dupla' ? 2 : 4;

    // Responde ao jogador que acabou de entrar imediatamente para mudar a tela dele no ato
    socket.emit('init_state', { room });

    // Atualiza a lista de todos os jogadores na sala
    io.to(roomId).emit('update_players', room.players);

    // Se completou a sala, dispara a fase seguinte
    if (room.players.length === maxPlayers && room.status === 'waiting') {
      if (room.gameMode === 'dupla') {
        room.status = 'playing';
        room.currentTurn = 'jogadores';
        room.cards = createNewGame('azul');
        io.to(roomId).emit('game_ready', { room });
      } else {
        room.status = 'jokenpo';
        room.jokenpo = { azul: null, amarelo: null };
        io.to(roomId).emit('start_jokenpo_phase', { room });
      }
    } else {
      io.to(roomId).emit('room_waiting_state', { room });
    }

    broadcastRoomsList();
  });

  // Lógica do Pedra, Papel ou Tesoura
  socket.on('send_jokenpo_choice', ({ roomId, choice }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'jokenpo') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.role !== 'observador') return;

    room.jokenpo[player.team] = choice;

    io.to(roomId).emit('log_message', `✊ <strong>${player.name}</strong> (Time ${player.team.toUpperCase()}) fez sua escolha no Pedra, Papel ou Tesoura!`);

    if (room.jokenpo.azul && room.jokenpo.amarelo) {
      const pAzul = room.jokenpo.azul;
      const pAma = room.jokenpo.amarelo;

      let winnerTeam = null;

      if (pAzul === pAma) {
        io.to(roomId).emit('log_message', `⚖️ <strong>EMPATE!</strong> Ambas as equipes escolheram ${pAzul.toUpperCase()}. Jogando novamente...`);
        room.jokenpo = { azul: null, amarelo: null };
        io.to(roomId).emit('jokenpo_draw');
        return;
      }

      if (
        (pAzul === 'pedra' && pAma === 'tesoura') ||
        (pAzul === 'tesoura' && pAma === 'papel') ||
        (pAzul === 'papel' && pAma === 'pedra')
      ) {
        winnerTeam = 'azul';
      } else {
        winnerTeam = 'amarelo';
      }

      room.status = 'choice';
      const winnerPlayer = room.players.find(p => p.team === winnerTeam && p.role === 'observador');

      io.to(roomId).emit('jokenpo_result', {
        winnerTeam,
        winnerName: winnerPlayer ? winnerPlayer.name : `Time ${winnerTeam.toUpperCase()}`,
        choices: room.jokenpo
      });
    }
  });

  // Decisão do vencedor do Pedra, Papel ou Tesoura
  socket.on('choose_starter_team', ({ roomId, starterTeam }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'choice') return;

    room.status = 'playing';
    room.currentTurn = starterTeam;
    room.cards = createNewGame(starterTeam);

    io.to(roomId).emit('game_ready', { room });
    io.to(roomId).emit('log_message', `🎲 A equipe <strong>${starterTeam.toUpperCase()}</strong> vai começar o jogo com a vantagem de 8 cartas!`);
  });

  socket.on('send_clue', ({ roomId, playerName, team, word, number }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;

    if (room.gameMode === 'confronto' && room.currentTurn !== team) {
      socket.emit('error_message', 'Não é o turno do seu time!');
      return;
    }

    const numClicks = parseInt(number, 10);
    room.activeClue = { word: word.toUpperCase(), number: numClicks, author: playerName };
    room.clicksRemaining = numClicks;

    io.to(roomId).emit('clue_updated', { clue: room.activeClue, clicksRemaining: room.clicksRemaining });
    io.to(roomId).emit('log_message', `📢 <strong>${playerName}</strong> enviou a dica: <strong>"${word.toUpperCase()}"</strong> para <strong>${number}</strong> carta(s).`);
  });

  socket.on('click_card', ({ roomId, cardId, playerName, team }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing') return;

    if (room.gameMode === 'confronto' && room.currentTurn !== team) {
      socket.emit('error_message', 'Não é o turno do seu time!');
      return;
    }

    if (!room.activeClue || room.clicksRemaining <= 0) {
      socket.emit('error_message', 'Aguarde a dica antes de clicar!');
      return;
    }

    const card = room.cards[cardId];
    if (card.revealed) return;

    card.revealed = true;
    room.clicksRemaining -= 1;

    io.to(roomId).emit('card_revealed', { cardId: card.id, type: card.type, clicksRemaining: room.clicksRemaining });

    if (room.gameMode === 'dupla') {
      if (card.type === 'azul') {
        io.to(roomId).emit('log_message', `🎯 <strong>${playerName}</strong> acertou uma carta dos AGENTES!`);
        if (room.cards.filter(c => c.type === 'azul' && !c.revealed).length === 0) {
          io.to(roomId).emit('game_over', { winner: 'jogadores' });
          return;
        }
      } else if (card.type === 'amarelo') {
        io.to(roomId).emit('log_message', `⚠️ <strong>${playerName}</strong> revelou carta do SISTEMA! Rodada encerrada.`);
        if (room.cards.filter(c => c.type === 'amarelo' && !c.revealed).length === 0) {
          io.to(roomId).emit('game_over', { winner: 'sistema' });
          return;
        }
        room.activeClue = null;
        room.clicksRemaining = 0;
        io.to(roomId).emit('turn_changed', { currentTurn: 'jogadores' });
        return;
      } else if (card.type === 'branca') {
        io.to(roomId).emit('log_message', `⚪ <strong>${playerName}</strong> escolheu uma carta NEUTRA.`);
        room.activeClue = null;
        room.clicksRemaining = 0;
        io.to(roomId).emit('turn_changed', { currentTurn: 'jogadores' });
        return;
      } else if (card.type === 'preta') {
        io.to(roomId).emit('log_message', `💥 <strong>${playerName}</strong> acertou a BOMBA!`);
        io.to(roomId).emit('game_over', { winner: 'sistema' });
        return;
      }

      if (room.clicksRemaining === 0) {
        room.activeClue = null;
        io.to(roomId).emit('turn_changed', { currentTurn: 'jogadores' });
      }
    } else {
      io.to(roomId).emit('log_message', `👉 <strong>${playerName}</strong> (${team.toUpperCase()}) revelou: <strong>${card.type.toUpperCase()}</strong>.`);

      if (card.type === 'preta') {
        const winner = team === 'azul' ? 'amarelo' : 'azul';
        io.to(roomId).emit('game_over', { winner });
        return;
      }

      const blueLeft = room.cards.filter(c => c.type === 'azul' && !c.revealed).length;
      const yellowLeft = room.cards.filter(c => c.type === 'amarelo' && !c.revealed).length;

      if (blueLeft === 0) { io.to(roomId).emit('game_over', { winner: 'azul' }); return; }
      if (yellowLeft === 0) { io.to(roomId).emit('game_over', { winner: 'amarelo' }); return; }

      let endTurn = (card.type !== team || room.clicksRemaining === 0);

      if (endTurn) {
        room.currentTurn = room.currentTurn === 'azul' ? 'amarelo' : 'azul';
        room.activeClue = null;
        room.clicksRemaining = 0;
        io.to(roomId).emit('turn_changed', { currentTurn: room.currentTurn });
      }
    }
  });

  socket.on('restart_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (room.gameMode === 'dupla') {
      room.status = 'playing';
      room.currentTurn = 'jogadores';
      room.cards = createNewGame('azul');
      io.to(roomId).emit('game_ready', { room });
    } else {
      room.status = 'jokenpo';
      room.jokenpo = { azul: null, amarelo: null };
      io.to(roomId).emit('start_jokenpo_phase', { room });
    }
  });

  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    const room = rooms[roomId];
    if (room) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        room.status = 'waiting';
        io.to(roomId).emit('update_players', room.players);
        io.to(roomId).emit('room_waiting_state', { room });
      }
      broadcastRoomsList();
    }
  });

  socket.on('disconnect', () => {
    for (const rId in rooms) {
      const room = rooms[rId];
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          delete rooms[rId];
        } else {
          room.status = 'waiting';
          io.to(rId).emit('update_players', room.players);
          io.to(rId).emit('room_waiting_state', { room });
        }
      }
    }
    broadcastRoomsList();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor Código 20 rodando em http://localhost:${PORT}`));