import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import DrawingsArea from './DrawingsArea';
import { Drawing, DrawingGameState, GameArea, GameStatus } from '../../../types/CoveyTownSocket';
import PhaserGameArea from './GameArea';
import * as DrawingCanvas from './DrawingCanvas';
import { mock, mockReset } from 'jest-mock-extended';
import { randomLocation } from '../../../TestUtils';
import TownController, * as TownControllerHooks from '../../../classes/TownController';
import TownControllerContext from '../../../contexts/TownControllerContext';
import PlayerController from '../../../classes/PlayerController';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('DrawingArea');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);
const boardComponentSpy = jest.spyOn(DrawingCanvas, 'default');
boardComponentSpy.mockReturnValue(<div data-testid='canvas' />);

class MockDrawingAreaController extends DrawingAreaController {
  makeMove = jest.fn();

  joinGame = jest.fn();

  mockIsPlayer = false;

  mockIsOurTurn = false;

  mockWinner: PlayerController | undefined = undefined;

  mockWhoseTurn: PlayerController | undefined = undefined;

  mockGameStatus: GameStatus = 'WAITING_TO_START';

  mockDrawingGameState: 

  mockDrawings: Drawing[] = [];

  mockIsActive = false;

    constructor() {
        super(mockGameArea);
    }
}

describe('DrawingsArea', () => {
  const interactableID = 'testID';
  const mockUseInteractableAreaController = DrawingAreaController as jest.MockedClass<
    typeof DrawingAreaController
  >;
  const mockUseTownController = TownController as jest.MockedClass<typeof TownController>;

  beforeEach(() => {
    mockUseInteractableAreaController.mockClear();
    mockUseTownController.mockClear();
    mockUseInteractableAreaController.mockImplementation(() => ({
      drawings: [],
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
    mockUseTownController.mockImplementation(() => ({
      ourPlayer: { id: 'playerID', userName: 'playerName' },
      getPlayer: jest.fn().mockReturnValue({ userName: 'authorName' }),
    }));
  });

  it('renders without crashing', () => {
    render(
      <ChakraProvider>
        <TownControllerContext.Provider value={new TownController()}>
          <DrawingsArea interactableID={interactableID} />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  });

  it('switches between drawing canvas and gallery', () => {
    const { getByText, getByTestId } = render(
      <ChakraProvider>
        <TownControllerContext.Provider value={new TownController()}>
          <DrawingsArea interactableID={interactableID} />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
    const button = getByText(/Switch to drawing canvas/i);
    fireEvent.click(button);
    expect(getByText(/Switch to gallery/i)).toBeInTheDocument();
    expect(getByTestId('canvas')).toBeInTheDocument();
  });
});
