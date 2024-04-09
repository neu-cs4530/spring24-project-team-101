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

  public endGame() {
    this.state = {
      ...this.state,
      status: 'OVER',
    };
  }

  public _join(player: Player): void {
    this._players.push(player);
    this.state = {
      ...this.state,
      players: this.state.players.concat(player.id),
    };
  }

  protected startGame(player: Player): void {
    this.state = {
      ...this.state,
      playersReady: this.state.playersReady.concat(player.id),
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
  });
});
