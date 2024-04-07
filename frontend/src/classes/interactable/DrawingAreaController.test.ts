import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { Drawing, DrawingGameState, GameArea, PlayerLocation } from '../../types/CoveyTownSocket';
import { DrawingEvents } from './DrawingAreaController';
import PlayerController from '../PlayerController';
import DrawingAreaController from './DrawingAreaController';
import { mockTownController } from '../../TestUtils';

describe('[T2] DrawingAreaController', () => {
  // A valid ConversationAreaController to be reused within the tests
  let testArea: DrawingAreaController;
  const testAreaID = nanoid();
  const townController = mockTownController({});
  const drawingArea = mock<GameArea<DrawingGameState>>();
  const mockListeners = mock<DrawingEvents>();
  let emitSpy: jest.SpyInstance;
  let sendInteractableCommandSpy: jest.SpyInstance;

  beforeEach(() => {
    sendInteractableCommandSpy = jest
      .spyOn(townController, 'sendInteractableCommand')
      .mockReturnValue(
        new Promise(resolve => {
          resolve(undefined);
        }),
      );
    drawingArea.game = {
      state: {
        drawings: [],
        status: 'IN_PROGRESS',
      },
      id: nanoid(),
      players: [],
    };
    testArea = new DrawingAreaController(testAreaID, drawingArea, townController);
    const playerLocation: PlayerLocation = {
      moving: false,
      x: 0,
      y: 0,
      rotation: 'front',
    };
    testArea.occupants = [
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
    ];
    testArea.addListener('drawingsChanged', mockListeners.drawingsChanged);
    emitSpy = jest.spyOn(testArea, 'emit');
  });
  afterEach(() => {
    mockClear(mockListeners.drawingsChanged);
    sendInteractableCommandSpy.mockClear();
    emitSpy.mockClear();
  });
  describe('isEmpty', () => {
    it('Returns true if the occupants list is empty, false otherwise', () => {
      expect(testArea.occupants.length).toBeGreaterThan(0);
      expect(testArea.isEmpty()).toBe(false);
      testArea.occupants = [];
      expect(testArea.occupants).toHaveLength(0);
      expect(testArea.isEmpty()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('returns false if occupants list is empty, true otherwise', () => {
      expect(testArea.occupants.length).toBeGreaterThan(0);
      expect(testArea.isActive()).toBe(true);
      testArea.occupants = [];
      expect(testArea.occupants).toHaveLength(0);
      expect(testArea.isActive()).toBe(false);
    });
  });

  describe('_updateFrom', () => {
    it('updates this.drawings and emits a DrawingsChanged event for changed set of drawings', () => {
      const newDrawing: Drawing = {
        drawingID: nanoid(),
        authorID: nanoid(),
        userDrawing: 'fakeDrawing',
      };
      const newArea: GameArea<DrawingGameState> = {
        game: {
          state: {
            drawings: [newDrawing],
            status: 'IN_PROGRESS',
          },
          id: nanoid(),
          players: [],
        },
        history: [],
        type: 'DrawingArea',
        occupants: [],
        id: nanoid(),
      };
      expect(testArea.drawings).toHaveLength(0);
      expect(emitSpy).not.toHaveBeenCalled();
      expect(mockListeners.drawingsChanged).not.toHaveBeenCalled();

      testArea.updateFrom(newArea, []);

      expect(testArea.drawings).toHaveLength(1);
      expect(testArea.drawings.map(drawing => drawing.userDrawing)).toContain(
        newDrawing.userDrawing,
      );
      expect(emitSpy).toHaveBeenCalledWith('drawingsChanged', [newDrawing]);
      expect(mockListeners.drawingsChanged).toHaveBeenCalledTimes(1);
    });
    it('does NOT update this.drawings or emit a DrawingsChanged event for unchanged set of drawings', () => {
      const drawing: Drawing = {
        drawingID: nanoid(),
        authorID: nanoid(),
        userDrawing: 'fakeDrawing',
      };
      const area: GameArea<DrawingGameState> = {
        game: {
          state: {
            drawings: [drawing],
            status: 'IN_PROGRESS',
          },
          id: nanoid(),
          players: [],
        },
        history: [],
        type: 'DrawingArea',
        occupants: [],
        id: nanoid(),
      };
      testArea.updateFrom(area, []);

      emitSpy.mockClear();
      mockListeners.drawingsChanged.mockClear();
      expect(testArea.drawings).toHaveLength(1);
      expect(emitSpy).not.toHaveBeenCalled();
      expect(mockListeners.drawingsChanged).not.toHaveBeenCalled();

      // update from same area = same drawings
      testArea.updateFrom(area, []);

      expect(testArea.drawings).toHaveLength(1);
      expect(emitSpy).not.toHaveBeenCalledWith('drawingsChanged', [drawing]);
      expect(mockListeners.drawingsChanged).not.toHaveBeenCalled();
    });
  });
  describe('makeMove', () => {
    it('sends the drawing to the server as a SaveDrawing command', async () => {
      const drawing: Drawing = {
        drawingID: nanoid(),
        authorID: nanoid(),
        userDrawing: 'fakeDrawing',
      };

      expect(sendInteractableCommandSpy).not.toHaveBeenCalled();

      await testArea.makeMove(drawing);

      expect(sendInteractableCommandSpy).toHaveBeenCalledWith(testArea.id, {
        type: 'SaveDrawing',
        drawing,
      });
    });
  });
});
