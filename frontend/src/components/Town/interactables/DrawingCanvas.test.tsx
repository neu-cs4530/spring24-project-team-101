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

      it('should toggle erase mode when the erase button is clicked', () => {
        const eraseToggle = screen.getByLabelText('erase toggle');
        fireEvent.click(eraseToggle);

        expect(eraseToggle).toHaveDisplayValue('Draw');

        fireEvent.click(eraseToggle);

        expect(eraseToggle).toHaveDisplayValue('Erase');
      });
    });

    describe('Saving', () => {
      it('Should display a save button', () => {
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
      it('Should display a color picker', () => {
        expect(screen.getByLabelText('color picker')).toBeInTheDocument();
      });

      it('should change the line color when clicked', () => {
        // how to have it click on a specific color?
        // check our color state somehow?
      });
    });

    describe('Thickness (Optional)', () => {
      it('Should display a button to increase thickness', () => {
        expect(screen.getByDisplayValue('Size up')).toBeInTheDocument();
      });

      it('should increase the line thickness when clicked', () => {
        const sizeUp = screen.getByDisplayValue('Size up');
        fireEvent.click(sizeUp);
        // check our size state somehow?
      });

      it('Should display a button to decrease thickness', () => {
        expect(screen.getByDisplayValue('Size down')).toBeInTheDocument();
      });

      it('should decrease the line thickness when clicked', () => {
        const sizeDown = screen.getByDisplayValue('Size down');
        fireEvent.click(sizeDown);
        // check our size state somehow?
      });
    });
  });
});
