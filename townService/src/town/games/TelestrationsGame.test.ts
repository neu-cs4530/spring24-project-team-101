import { createPlayerForTesting } from '../../TestUtils';
import TelestrationsGame from './TelestrationsGame';
import { TelestrationsGameState } from '../../types/CoveyTownSocket';
import { PLAYER_ALREADY_IN_GAME_MESSAGE } from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';

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
    it('only starts the game if there are two or more ready players', () => {
      // TODO
    });
    it('starts the game when all two or more players are ready', () => {
      // TODO
    });
    test('if the player is already ready, nothing changes', () => {
      // TODO
    });
    test('The first game phase after starting is picking a word', () => {
      // TODO
    });
    test('if there are an even number of players, players draw their own word', () => {
      // TODO
    });
    test('if there are an even number of players, players do not draw their own word', () => {
      // TODO
    });
  });

  describe('ApplyMove', () => {
    it('should rotate drawings and guesses in the correct order', () => {
      // TODO
    });
    it('should end the game when a player receives a guess or drawing in their own chain', () => {
      // TODO
    });
    it('alternates between drawing and guessing', () => {
      // TODO
    });
    it('properly stores chains of drawings and guesses', () => {
      // TODO
    });
  });
});
