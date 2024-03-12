import { createPlayerForTesting } from '../../TestUtils';
import TelestrationsGame from './TelestrationsGame';
import { TelestrationsGameState } from '../../types/CoveyTownSocket';
import { PLAYER_ALREADY_IN_GAME_MESSAGE } from '../../lib/InvalidParametersError';

describe('Telestrations Game', () => {
  let game: TelestrationsGame;

  beforeEach(() => {
    game = new TelestrationsGame('state' as unknown as TelestrationsGameState);
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
      // TODO
    });
    test('if the game is WAITING_TO_START and a player leaves, the other players readiness is preserved', () => {
      // TODO
    });
    test('if the game is WAITING_TO_START and the only unready player leaves and there are two or more players, the game starts', () => {
      // TODO
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
