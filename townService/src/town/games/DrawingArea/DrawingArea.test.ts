import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import DrawingArea from './DrawingArea';
import * as DrawingGameModule from './DrawingGame';
import { Drawing, DrawingGameState, GameMove, TownEmitter } from '../../../types/CoveyTownSocket';
import Game from '../Game';
import Player from '../../../lib/Player';
import { createPlayerForTesting } from '../../../TestUtils';
import { INVALID_COMMAND_MESSAGE } from '../../../lib/InvalidParametersError';

class MockDrawingGame extends Game<DrawingGameState, Drawing> {
  public constructor() {
    super({
      drawings: [],
      status: 'IN_PROGRESS',
    });
  }

  public applyMove(move: GameMove<Drawing>): void {}

  protected _join(player: Player): void {
    throw new Error('Method not implemented.');
  }

  protected _leave(player: Player): void {
    throw new Error('Method not implemented.');
  }
}
describe('DrawingArea', () => {
  let drawingArea: DrawingArea;
  let interactableUpdateSpy: jest.SpyInstance;
  const gameConstructorSpy = jest.spyOn(DrawingGameModule, 'default');
  let game: MockDrawingGame;
  let applyMoveSpy: jest.SpyInstance;
  beforeEach(() => {
    gameConstructorSpy.mockClear();
    game = new MockDrawingGame();
    applyMoveSpy = jest.spyOn(game, 'applyMove');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);
    drawingArea = new DrawingArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(drawingArea, '_emitAreaChanged');
  });
  it('should initialize the _game field', () => {
    expect(drawingArea.game).toBeDefined();
  });

  it('should initially be inactive', () => {
    expect(drawingArea.occupants).toHaveLength(0);
    expect(drawingArea.isActive).toBeFalsy();
  });

  it('should correctly handle a valid SaveDrawing command', () => {
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
    drawingArea.handleCommand(
      {
        type: 'SaveDrawing',
        drawing: { drawingID: 'id', authorID: 'id', userDrawing: 'fake drawing' },
      },
      createPlayerForTesting(),
    );
    expect(applyMoveSpy).toHaveBeenCalledTimes(1);
    expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit if applyMove fails', () => {
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
    applyMoveSpy.mockImplementationOnce(() => {
      throw new Error('Test Error');
    });
    expect(() =>
      drawingArea.handleCommand(
        {
          type: 'SaveDrawing',
          drawing: { drawingID: 'id', authorID: 'id', userDrawing: 'fake drawing' },
        },
        createPlayerForTesting(),
      ),
    ).toThrowError('Test Error');
    expect(applyMoveSpy).toHaveBeenCalledTimes(1);
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });

  it('should reject a GameMoveCommand', () => {
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
    expect(() =>
      drawingArea.handleCommand(
        {
          type: 'GameMove',
          gameID: nanoid(),
          move: {
            gamePiece: 'Red',
            col: 1,
            row: 1,
          },
        },
        createPlayerForTesting(),
      ),
    ).toThrowError(INVALID_COMMAND_MESSAGE);
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });

  it('should reject a JoinGameCommand', () => {
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
    expect(() =>
      drawingArea.handleCommand(
        {
          type: 'JoinGame',
        },
        createPlayerForTesting(),
      ),
    ).toThrowError(INVALID_COMMAND_MESSAGE);
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });

  it('should reject a LeaveGameCommand', () => {
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
    expect(() =>
      drawingArea.handleCommand(
        {
          type: 'LeaveGame',
          gameID: nanoid(),
        },
        createPlayerForTesting(),
      ),
    ).toThrowError(INVALID_COMMAND_MESSAGE);
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });

  it('should reject a StartGameCommand', () => {
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
    expect(() =>
      drawingArea.handleCommand(
        {
          type: 'StartGame',
          gameID: nanoid(),
        },
        createPlayerForTesting(),
      ),
    ).toThrowError(INVALID_COMMAND_MESSAGE);
    expect(applyMoveSpy).not.toHaveBeenCalled();
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });
});
