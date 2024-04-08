import DrawingCanvas from './DrawingCanvas';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { mock, mockClear } from 'jest-mock-extended';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';
import TelestrationsAreaController from '../../../classes/interactable/TelestrationsAreaController';
import { nanoid } from 'nanoid';
import { Drawing } from '../../../../../shared/types/CoveyTownSocket';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});

describe('DrawingCanvas', () => {
  describe('Telestrations use case', () => {
    // TODO: test that the correct things are displayed when a
    // telestrationsareacontroller is passed in as the controller prop
    // see tests below for examples
    const telestrationsController = mock<TelestrationsAreaController>();
    const authorID = nanoid();
    let makeMoveSpy: jest.SpyInstance<Promise<void>, [input: string | Drawing]>;
    beforeEach(() => {
      makeMoveSpy = jest.spyOn(telestrationsController, 'makeMove');
      jest.spyOn(telestrationsController, 'toInteractableAreaModel').mockReturnValue({
        game: {
          state: {
            status: 'IN_PROGRESS',
            players: [],
            chains: [],
            playersReady: [],
            gamePhase: 2, // Simulate being in phase 2
            activeChains: [],
          },
          id: nanoid(),
          players: [],
        },
        history: [],
        type: 'TelestrationsArea',
        id: nanoid(),
        occupants: [],
      });
      render(<DrawingCanvas controller={telestrationsController} authorID={authorID} />);
    });
    afterEach(() => {
      makeMoveSpy.mockClear();
      cleanup();
    });
    describe('Basic elements present', () => {
      it('should display a drawing canvas', () => {
        // the library does not include any accessibility tags or really anything useful
        // to identify the CanvasDraw component. it creates 4 <canvas> elements, but the test shouldn't rely on that
        expect(document.getElementsByTagName('canvas').length).toBeGreaterThan(0);
      });

      it('should render all the buttons', () => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toEqual(4);
      });
    });
    describe('Erasing', () => {
      it('Should display an erase button', () => {
        expect(screen.getAllByText('Erase')).toHaveLength(1);
      });
      it('should toggle erase mode when the erase button is clicked', () => {
        const eraseToggle = screen.getByLabelText('toggle erase');
        fireEvent.click(eraseToggle);

        expect(screen.queryAllByText('Erase')).toHaveLength(0);
        expect(screen.getAllByText('Draw')).toHaveLength(1);

        fireEvent.click(eraseToggle);

        expect(screen.getAllByText('Erase')).toHaveLength(1);
        expect(screen.queryAllByText('Draw')).toHaveLength(0);
      });
    });
    describe('Submitting drawing', () => {
      it('Should display a button to submit to game', async () => {
        expect(screen.getAllByText('Submit')).toHaveLength(1);
        const sendGalleryButton = screen.getByText('Submit');
        expect(makeMoveSpy).not.toHaveBeenCalled();
        await waitFor(() => {
          fireEvent.click(sendGalleryButton);
        });
        expect(makeMoveSpy).toHaveBeenCalledTimes(1);
      });
      it('should display a toast when submission fails', async () => {
        makeMoveSpy.mockRejectedValue(new Error('Test Error'));
        mockClear(mockToast);
        const submitButton = screen.getByText('Submit');
        act(() => {
          fireEvent.click(submitButton);
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              status: 'error',
              description: `Error: Test Error`,
            }),
          );
        });
      });
    });
  });
  describe('Drawing area use case', () => {
    const gameAreaController = mock<DrawingAreaController>();
    Object.defineProperty(gameAreaController, 'saveData', {
      get: () => {
        // canvasdraw library expects a json string with these properties
        return '{"lines":[],"width":400,"height":400}';
      },
      set: () => {},
      configurable: true,
    });
    const authorID = nanoid();
    let makeMoveSpy: jest.SpyInstance<Promise<void>, [drawing: Drawing]>;

    beforeEach(() => {
      makeMoveSpy = jest.spyOn(gameAreaController, 'makeMove');
      jest.spyOn(gameAreaController, 'toInteractableAreaModel').mockReturnValue({
        game: {
          state: {
            drawings: [],
            status: 'IN_PROGRESS',
          },
          id: nanoid(),
          players: [],
        },
        history: [],
        type: 'DrawingArea',
        id: nanoid(),
        occupants: [],
      });
      act(() => {
        render(<DrawingCanvas controller={gameAreaController} authorID={authorID} />);
      });
    });
    afterEach(() => {
      makeMoveSpy.mockClear();
      cleanup();
    });

    describe('Basic elements present', () => {
      it('should display a drawing canvas', () => {
        // the library does not include any accessibility tags or really anything useful
        // to identify the CanvasDraw component. it creates 4 <canvas> elements, but the test shouldn't rely on that
        expect(document.getElementsByTagName('canvas').length).toBeGreaterThan(0);
      });

      it('should render all the buttons', () => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toEqual(7);
      });
    });

    describe('Erasing', () => {
      it('Should display an erase button', () => {
        expect(screen.getAllByText('Erase')).toHaveLength(1);
      });

      it('should toggle erase mode when the erase button is clicked', () => {
        const eraseToggle = screen.getByLabelText('toggle erase');
        fireEvent.click(eraseToggle);

        expect(screen.queryAllByText('Erase')).toHaveLength(0);
        expect(screen.getAllByText('Draw')).toHaveLength(1);

        fireEvent.click(eraseToggle);

        expect(screen.getAllByText('Erase')).toHaveLength(1);
        expect(screen.queryAllByText('Draw')).toHaveLength(0);
      });
    });

    describe('Saving and loading', () => {
      it('Should have a save button', () => {
        expect(screen.getAllByText('Save')).toHaveLength(1);
        const saveButton = screen.getByText('Save');
        const setDataSpy = jest.spyOn(gameAreaController, 'saveData', 'set');
        expect(setDataSpy).not.toHaveBeenCalled();

        fireEvent.click(saveButton);

        expect(setDataSpy).toHaveBeenCalledTimes(1);
      });

      it('Should display a download button', () => {
        expect(screen.getAllByText('Download')).toHaveLength(1);
      });

      it('Should have a load button', () => {
        expect(screen.getAllByText('Load')).toHaveLength(1);
        const loadButton = screen.getByText('Load');
        const getDataSpy = jest.spyOn(gameAreaController, 'saveData', 'get');
        expect(getDataSpy).not.toHaveBeenCalled();

        fireEvent.click(loadButton);

        expect(getDataSpy).toHaveBeenCalledTimes(1);
      });

      it('Should display a button to send image to gallery', async () => {
        expect(screen.getAllByText('Send to gallery')).toHaveLength(1);
        const sendGalleryButton = screen.getByText('Send to gallery');
        expect(makeMoveSpy).not.toHaveBeenCalled();

        await waitFor(() => {
          fireEvent.click(sendGalleryButton);
        });

        expect(makeMoveSpy).toHaveBeenCalledTimes(1);
      });

      it('should display a toast when sending to gallery fails', async () => {
        makeMoveSpy.mockRejectedValue(new Error('Test Error'));
        mockClear(mockToast);

        expect(screen.getAllByText('Send to gallery')).toHaveLength(1);
        const sendGalleryButton = screen.getByText('Send to gallery');
        expect(makeMoveSpy).not.toHaveBeenCalled();
        expect(mockToast).not.toHaveBeenCalled();

        act(() => {
          fireEvent.click(sendGalleryButton);
        });

        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              status: 'error',
              description: `Error: Test Error`,
            }),
          );
        });

        expect(makeMoveSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('Color (Optional)', () => {
      it('Should display a color picker', () => {
        const colorPicker = document.getElementsByClassName('color-picker');
        expect(colorPicker).toBeDefined();
      });
    });

    describe('Thickness (Optional)', () => {
      it('Should display a button to increase thickness', () => {
        expect(screen.getAllByText('Size up')).toHaveLength(1);
      });

      it('Should display a button to decrease thickness', () => {
        expect(screen.getAllByText('Size down')).toHaveLength(1);
      });
    });
  });
});
