import DrawingCanvas from './DrawingCanvas';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

describe('DrawingCanvas', () => {
  describe('can we render the component at all?', () => {
    afterEach(cleanup);
    it('should render all the buttons', () => {
      render(<DrawingCanvas />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toEqual(6);
    });
  });

  describe('Button tests', () => {
    beforeEach(() => {
      render(<DrawingCanvas />);
    });
    afterEach(cleanup);

    describe('Erasing', () => {
      it('Should display an erase button', () => {
        expect(screen.getByLabelText('Erase')).toBeInTheDocument();
      });

      it('should toggle erase mode when the erase button is clicked', () => {});
    });

    describe('Saving', () => {
      it('Should display an erase button', () => {
        expect(screen.getByLabelText('Save')).toBeInTheDocument();
      });

      it('should save the image somehow when the button is clicked', () => {
        expect(screen.getByLabelText('Save')).toBeInTheDocument();
        const saveButton = screen.getByLabelText('Save');

        // TODO: We have to figure out how the saving is going to work first
        fireEvent.click(saveButton);
      });
    });

    describe('Color (Optional)', () => {
      it('Should display a color button', () => {});

      it('should change the line color when clicked clicked', () => {});
    });

    describe('Thickness (Optional)', () => {
      it('Should display a thickness button', () => {});

      it('should change the line thickness when clicked clicked', () => {});
    });
  });
});
