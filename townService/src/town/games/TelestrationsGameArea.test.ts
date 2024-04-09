import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import Game from './Game';
import {
  TelestrationsGameState,
  TelestrationsMove,
  TownEmitter,
} from '../../types/CoveyTownSocket';
import TelestrationsGameArea from './TelestrationsGameArea';
import * as TelestrationsGameModule from './TelestrationsGame';

class TestingGame extends Game<TelestrationsGameState, TelestrationsMove> {
  public constructor() {
    super({
      players: [],
      playersReady: [],
      chains: [[]],
      activeChains: [],
      gamePhase: 0,
      status: 'WAITING_FOR_PLAYERS',
    });
  }

  public applyMove(): void {}

  public startGame(player: Player): void {
    this.state = {
      ...this.state,
      playersReady: this.state.playersReady.concat(player.id),
    };
  }

  public endGame() {
    this.state = {
      ...this.state,
      status: 'OVER',
    };
  }

  protected _join(player: Player): void {
    this._players.push(player);
    this.state = {
      ...this.state,
      players: this.state.players.concat(player.id),
    };
  }

  protected _leave(): void {}
}

describe('TelestrationsGameArea', () => {
  let gameArea: TelestrationsGameArea;
  let players: Player[];
  let interactableUpdateSpy: jest.SpyInstance;
  const gameConstructorSpy = jest.spyOn(TelestrationsGameModule, 'default');
  let game: TestingGame;

  beforeEach(() => {
    gameConstructorSpy.mockClear();
    game = new TestingGame();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);

    players = new Array(7).fill(undefined).map(() => createPlayerForTesting());
    gameArea = new TelestrationsGameArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
    );
    players.forEach(player => {
      gameArea.add(player);
      game.join(player);
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(gameArea, '_emitAreaChanged');
  });

  describe('JoinGame command', () => {
    test('when there is no existing game, it should create a new game and call _emitAreaChanged', () => {
      expect(gameArea.game).toBeUndefined();
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
      expect(gameArea.game).toBeDefined();
      expect(gameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
    });
    test('when the existing game is over, it should create a new game and call _emitAreaChanged', () => {
      expect(gameArea.game).toBeUndefined();

      gameConstructorSpy.mockClear();
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
      expect(gameArea.game).toBeDefined();
      expect(gameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
      expect(gameConstructorSpy).toHaveBeenCalledTimes(1);
      game.endGame();

      gameConstructorSpy.mockClear();
      const { gameID: newGameID } = gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
      expect(gameArea.game).toBeDefined();
      expect(newGameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
      expect(gameConstructorSpy).toHaveBeenCalledTimes(1);
    });

    describe('when there is a game in progress', () => {
      it('should call join on the game and call _emitAreaChanged', () => {
        const player1 = players[0];
        const player2 = players[1];
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);

        const joinSpy = jest.spyOn(game, 'join');
        const gameID2 = gameArea.handleCommand({ type: 'JoinGame' }, player2).gameID;
        expect(joinSpy).toHaveBeenCalledWith(player2);
        expect(gameID).toEqual(gameID2);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        const player1 = players[0];
        const player2 = players[1];
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();

        const joinSpy = jest.spyOn(game, 'join').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() => gameArea.handleCommand({ type: 'JoinGame' }, player2)).toThrowError(
          'Test Error',
        );
        expect(joinSpy).toHaveBeenCalledWith(player2);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('LeaveGame command', () => {
    it('should throw an error if there is no game in progress and not call _emitAreaChanged', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, players[0]),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      expect(interactableUpdateSpy).not.toHaveBeenCalled();
    });

    describe('when there is a game in progress', () => {
      it('should throw an error if the gameID does not match the game and not call _emitAreaChanged', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
        interactableUpdateSpy.mockClear();
        expect(() =>
          gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, players[0]),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
    });
    it('should call leave on the game and call _emitAreaChanged', () => {
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
      if (!game) {
        throw new Error('Game was not created by the first call to join');
      }
      expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      const leaveSpy = jest.spyOn(game, 'leave');
      gameArea.handleCommand({ type: 'LeaveGame', gameID }, players[0]);
      expect(leaveSpy).toHaveBeenCalledWith(players[0]);
      expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
    });
    it('should not call _emitAreaChanged if the game throws an error', () => {
      gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
      if (!game) {
        throw new Error('Game was not created by the first call to join');
      }
      interactableUpdateSpy.mockClear();
      const leaveSpy = jest.spyOn(game, 'leave').mockImplementationOnce(() => {
        throw new Error('Test Error');
      });
      expect(() =>
        gameArea.handleCommand({ type: 'LeaveGame', gameID: game.id }, players[0]),
      ).toThrowError('Test Error');
      expect(leaveSpy).toHaveBeenCalledWith(players[0]);
      expect(interactableUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('StartGame command', () => {
    it('when there is no game, it should throw an error and not call _emitAreaChanged', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, players[0]),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });

    describe('when there is a game in progress', () => {
      it('should call startGame on the game and call _emitAreaChanged', () => {
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
        interactableUpdateSpy.mockClear();
        gameArea.handleCommand({ type: 'StartGame', gameID }, players[1]);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();

        const startSpy = jest.spyOn(game, 'startGame').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'StartGame', gameID: game.id }, players[1]),
        ).toThrowError('Test Error');
        expect(startSpy).toHaveBeenCalledWith(players[1]);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      test('when the game ID mismatches, it should throw an error and not call _emitAreaChanged', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, players[0]);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(() =>
          gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, players[0]),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
      });
    });
  });

  it('throws an error on an invalid command', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing an invalid command, only possible at the boundary of the type system)
    expect(() => gameArea.handleCommand({ type: 'InvalidCommand' }, players[0])).toThrowError(
      INVALID_COMMAND_MESSAGE,
    );
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });
});
