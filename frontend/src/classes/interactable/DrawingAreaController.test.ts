import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { PlayerLocation } from '../../types/CoveyTownSocket';
import { DrawingEvents } from './DrawingAreaController';
import PlayerController from '../PlayerController';
import DrawingAreaController from './DrawingAreaController';

describe('[T2] DrawingAreaController', () => {
  // A valid ConversationAreaController to be reused within the tests
  let testArea: DrawingAreaController;
  const mockListeners = mock<DrawingEvents>();
  beforeEach(() => {
    const playerLocation: PlayerLocation = {
      moving: false,
      x: 0,
      y: 0,
      rotation: 'front',
    };
    testArea = new DrawingAreaController(nanoid());
    testArea.occupants = [
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
    ];
    testArea.drawing = undefined;
    mockClear(mockListeners.occupantsChange);
    mockClear(mockListeners.topicChange);
    testArea.addListener('occupantsChange', mockListeners.occupantsChange);
    testArea.addListener('topicChange', mockListeners.topicChange);
  });
  describe('isEmpty', () => {
    it('Returns true if the occupants list is empty and the drawing is undefined', () => {
      testArea.occupants = [];
      testArea.drawing = undefined;
      expect(testArea.isEmpty()).toBe(true);
    });
    it('Returns false if the occupants list is set and the topic is defined', () => {
      expect(testArea.isEmpty()).toBe(false);
    });
  });
});