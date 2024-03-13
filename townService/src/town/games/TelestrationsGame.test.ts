import { nanoid } from 'nanoid';
import { createPlayerForTesting } from '../../TestUtils';
import TelestrationsGame from './TelestrationsGame';
import {
  Drawing,
  GameMove,
  TelestrationsGameState,
  TelestrationsMove,
} from '../../types/CoveyTownSocket';
import {
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';

function startedGame(game: TelestrationsGame, players: Array<Player>): TelestrationsGame {
  players.forEach(p => game.join(p));
  players.forEach(p => game.startGame(p));
  return game;
}

function createMove(
  game: TelestrationsGame,
  player: Player,
  drawing?: Drawing,
  word?: string,
): GameMove<TelestrationsMove> {
  return {
    gameID: game.id,
    playerID: player.id,
    move: { action: game.state.gamePhase, word, drawing },
  };
}

function createDrawing(player: Player): Drawing {
  return {
    drawingID: nanoid(),
    authorID: player.id,
    length: 1,
    width: 1,
    userDrawing: ':3', // dummy value
  };
}

/**
 * The player makes a move in the game without caring about the contents of the move.
 * The guess/word will always be the player's ID to make testing easier.
 */
function applyArbitraryMove(game: TelestrationsGame, player: Player): void {
  game.applyMove(createMove(game, player, createDrawing(player), player.id));
}

describe('Telestrations Game', () => {
  let game: TelestrationsGame;
  let players: Array<Player>;

  beforeEach(() => {
    game = new TelestrationsGame('state' as unknown as TelestrationsGameState);
    players = [];
    for (let i = 0; i < 8; i++) {
      players.push(createPlayerForTesting());
    }
  });
  describe('Join', () => {
    it('should throw an error if the player is already in the game', () => {
      const player1 = createPlayerForTesting();
      game.join(player1);
      expect(() => game.join(player1)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });
    test('a player who joins is the last player in the rotation order', () => {
      const player1 = createPlayerForTesting();
      game.join(player1);
      expect(game.state.players[game.state.players.length - 1]).toBe(player1.id);
    });
  });

  describe('Leave', () => {
    it('should throw an error if the player is not in the game', () => {
      const player1 = createPlayerForTesting();
      expect(() => game.leave(player1)).toThrowError('Player not in game');
    });
    test('if the game is in progress and any player leaves, the game ends', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.startGame(player1);
      game.startGame(player2);
      game.leave(player1);
      // expect game status to be over
    });
    test('if the game is over and the player leaves, the state is not updated', () => {
      const player1 = players[0];
      const player2 = players[1];
      game.join(player1);
      game.join(player2);
      game.startGame(player1);
      game.startGame(player2);
      expect(game.state.players).toContain(player1.id);
      expect(game.state.players).toContain(player2.id);
      game.leave(player1);
      expect(game.state.status).toBe('OVER');
      const stateBeforeLeaving = { ...game.state };
      game.leave(player2);
      expect(game.state).toEqual(stateBeforeLeaving);
    });
    test('if the game is WAITING_TO_START and a ready player leaves, that player is removed from the ready list', () => {
      // add players to the game and make all of them except player 1 ready
      for (const player of players) {
        game.join(player);
        if (player !== players[0]) {
          game.startGame(player);
        }
      }

      // Player 1 isn't in the game to avoid starting
      expect(game.state.playersReady).not.toContain(players[0]);
      players.slice(1).forEach(p => expect(game.state.playersReady).toContain(p.id));

      for (const player of players) {
        game.leave(player);
        expect(game.state.playersReady).not.toContain(player.id);
      }
    });

    test('if the game is WAITING_TO_START and a player leaves, the other player`s readiness is preserved', () => {
      // add players to the game and make all of them except player 1 ready
      for (const player of players) {
        game.join(player);
        if (player !== players[0]) {
          game.startGame(player);
        }
      }

      // Player 1 isn't in the game to avoid starting
      expect(game.state.playersReady).not.toContain(players[0]);
      // For each ready player...
      for (let i = 1; i < players.length; i++) {
        // Leave the game and check that.
        game.leave(players[i]);
        expect(game.state.playersReady).not.toContain(players[i].id);
        // For each remaining player...
        for (let j = i; j < players.length; j++) {
          // make sure they're still ready.
          expect(game.state.playersReady).toContain(players[j].id);
        }
      }
    });

    test('if the game is WAITING_TO_START and the only unready player leaves and there are two or more players, the game starts', () => {
      players.slice(1).forEach(p => game.join(p));
      // All players except 1 are ready:
      expect(game.state.playersReady).not.toContain(players[0].id);
      players.slice(1).forEach(p => expect(game.state.playersReady).toContain(p.id));

      expect(game.state.status).toBe('WAITING_TO_START');

      // Remove player 1
      game.leave(players[0]);
      // All players are ready:
      players.forEach(p => expect(game.state.playersReady).toContain(p.id));
      expect(game.state.status).toBe('IN_PROGRESS');
    });
  });

  describe('StartGame', () => {
    it('should throw an error if the player is not in the game', () => {
      expect(() => game.join(players[0])).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });
    it('only starts the game if there are two or more ready players', () => {
      game.join(players[0]);
      expect(game.state.status).toBe('WAITING_TO_START'); // This may end up being WAITING_FOR_PLAYERS...
      game.startGame(players[0]);
      expect(game.state.status).toBe('WAITING_TO_START');
      game.join(players[1]);
      expect(game.state.status).toBe('WAITING_TO_START');
    });
    it('starts the game when all two or more players are ready', () => {
      game.join(players[0]);
      expect(game.state.status).toBe('WAITING_TO_START'); // This may end up being WAITING_FOR_PLAYERS...
      game.startGame(players[0]);
      expect(game.state.status).toBe('WAITING_TO_START');
      game.join(players[1]);
      expect(game.state.status).toBe('WAITING_TO_START');
      game.startGame(players[1]);
      expect(game.state.status).toBe('IN_PROGRESS');
    });
    test('if the player is already ready, nothing changes', () => {
      game.join(players[0]);
      game.startGame(players[0]);
      const beforeState = { ...game.state };
      expect(game.state.playersReady).toContain(players[0].id);

      game.startGame(players[0]);
      expect(game.state).toEqual(beforeState);
    });
    test('The first game phase after starting is picking a word', () => {
      startedGame(game, players);
      expect(game.state.gamePhase).toBe('PICK_WORD');
    });
  });

  describe('ApplyMove', () => {
    describe('Errors', () => {
      it('should throw an error if the player isn`t in the game', () => {
        startedGame(game, players);
        expect(() => applyArbitraryMove(game, createPlayerForTesting())).toThrowError();
      });

      it('should throw an error if the game is WAITING_FOR_PLAYERS or WAITING_TO_START', () => {
        game.join(players[0]);
        expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        expect(() => applyArbitraryMove(game, players[0])).toThrowError();

        game.join(players[1]);
        expect(game.state.status).toBe('WAITING_TO_START');
        expect(() => applyArbitraryMove(game, players[0])).toThrowError();
      });

      it('should throw an error if the game is OVER', () => {
        const threePlayers = players.slice(0, 3);
        startedGame(game, threePlayers);
        // This should take three rounds: Picking, Drawing, Guessing
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        threePlayers.forEach(player => applyArbitraryMove(game, player));

        expect(game.state.status).toBe('OVER');
        expect(() => applyArbitraryMove(game, threePlayers[0])).toThrowError();
      });

      it('should throw an error if the game is in a picking phase and the move doesn`t include a word', () => {
        const threePlayers = players.slice(0, 3);
        startedGame(game, threePlayers);
        // This should take three rounds: Picking, Drawing, Guessing
        expect(game.state.gamePhase).toBe('PICK_WORD');

        expect(() =>
          game.applyMove(createMove(game, threePlayers[0], undefined, undefined)),
        ).toThrowError();
      });

      it('should throw an error if the game is in a draw phase and the move doesn`t include a drawing', () => {
        const threePlayers = players.slice(0, 3);
        startedGame(game, threePlayers);
        // This should take three rounds: Picking, Drawing, Guessing
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('DRAW');

        expect(() => game.applyMove(createMove(game, threePlayers[0], undefined))).toThrowError();
      });

      it('should throw an error if the game is in a guessing phase and the move doesn`t include a word', () => {
        const threePlayers = players.slice(0, 3);
        startedGame(game, threePlayers);
        // This should take three rounds: Picking, Drawing, Guessing
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('GUESS');

        expect(() =>
          game.applyMove(createMove(game, threePlayers[0], undefined, undefined)),
        ).toThrowError();
      });
    });

    describe('Gameplay', () => {
      it('should rotate drawings and guesses in the correct order', () => {
        startedGame(game, players);

        expect(game.state.gamePhase).toBe('PICK_WORD');
        players.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('DRAW');
        players.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('GUESS');
        players.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('DRAW');
        players.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('GUESS');
        players.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('DRAW');
        players.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('GUESS');
        players.forEach(player => applyArbitraryMove(game, player));
      });

      it('should end the game when all players have contributed to each chain', () => {
        const threePlayers = players.slice(0, 3);
        startedGame(game, threePlayers);
        // This should take three rounds: Picking, Drawing, Guessing
        expect(game.state.gamePhase).toBe('PICK_WORD');
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('DRAW');
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('GUESS');
        threePlayers.forEach(player => applyArbitraryMove(game, player));

        expect(game.state.status).toBe('OVER');
      });

      it('properly stores chains of drawings and guesses', () => {
        /*
          W = Word, D = Drawing, G = Guess

           G2  G3  G1
          /   /   /
             /   /   /
           D3  D1  D2
          /   /   /
             /   /  /
           W1  W2  W3
          [1] [2] [3]
        
        */
        const threePlayers = players.slice(0, 3);
        startedGame(game, threePlayers);
        // This should take three rounds: Picking, Drawing, Guessing
        expect(game.state.gamePhase).toBe('PICK_WORD');
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('DRAW');
        threePlayers.forEach(player => applyArbitraryMove(game, player));
        expect(game.state.gamePhase).toBe('GUESS');
        threePlayers.forEach(player => applyArbitraryMove(game, player));

        // Player 1's chain:
        expect(game.state.chains[0][0].word).toBe(threePlayers[0].id);
        expect(game.state.chains[0][1].drawing?.authorID).toBe(threePlayers[2].id);
        expect(game.state.chains[0][2].word).toBe(threePlayers[1].id);

        // Player 2's chain:
        expect(game.state.chains[1][0].word).toBe(threePlayers[1].id);
        expect(game.state.chains[1][1].drawing?.authorID).toBe(threePlayers[0].id);
        expect(game.state.chains[1][2].word).toBe(threePlayers[3].id);

        // Player 3's chain:
        expect(game.state.chains[1][0].word).toBe(threePlayers[2].id);
        expect(game.state.chains[1][1].drawing?.authorID).toBe(threePlayers[1].id);
        expect(game.state.chains[1][2].word).toBe(threePlayers[0].id);
      });

      test('if there are an even number of players, players draw their own word', () => {
        startedGame(game, players);
        expect(game.state.players.length % 2).toEqual(0);
        expect(game.state.gamePhase).toBe('PICK_WORD');
        // Every player picks a word equal to their id:
        players.forEach(player => game.applyMove(createMove(game, player, undefined, player.id)));
        expect(game.state.gamePhase).toBe('DRAW');
        // have each player submit a drawing
        players.forEach(player =>
          game.applyMove(createMove(game, player, createDrawing(player), player.id)),
        );

        game.state.chains.forEach(chain => {
          const word = chain[0];
          const draw = chain[1];
          expect(word).toEqual(draw.drawing?.authorID);
        });
      });

      test('if there are an odd number of players, players do not draw their own word', () => {
        startedGame(game, players);
        expect(game.state.players.length % 2).toEqual(0);
        expect(game.state.gamePhase).toBe('PICK_WORD');
        // Every player picks a word equal to their id:
        players.forEach(player => game.applyMove(createMove(game, player, undefined, player.id)));
        expect(game.state.gamePhase).toBe('DRAW');
        // have each player submit a drawing
        players.forEach(player =>
          game.applyMove(createMove(game, player, createDrawing(player), player.id)),
        );

        game.state.chains.forEach(chain => {
          const word = chain[0];
          const draw = chain[1];
          expect(word).not.toEqual(draw.drawing?.authorID);
        });
      });
    });
  });
});
