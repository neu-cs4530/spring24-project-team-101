import DrawingCanvas from './DrawingCanvas';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

describe('DrawingCanvas', () => {
  describe('can we render the component at all?', () => {
    afterEach(cleanup);
    it('should render all the buttons by default', () => {
      render(<DrawingCanvas />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toEqual(7);
    });

    it('should not render saving/loading buttons in telestrations mode', () => {
      render(<DrawingCanvas telestrations={true}></DrawingCanvas>);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toEqual(3);
    });
  });

  describe('Button tests', () => {
    beforeEach(() => {
      render(<DrawingCanvas />);
    });
    afterEach(cleanup);

    describe('Canvas', () => {
      it('should display a drawing canvas', () => {
        // the library does not include any accessibility tags or really anything useful
        // to identify the CanvasDraw component. it creates 4 <canvas> elements, but the test shouldn't rely on that
        expect(document.getElementsByTagName('canvas').length).toBeGreaterThan(0);
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
      it('Should display a save button', () => {
        expect(screen.getAllByText('Save')).toHaveLength(1);
      });

      it('Should display a download button', () => {
        expect(screen.getAllByText('Download')).toHaveLength(1);
      });

      it('Should display a load button', () => {
        expect(screen.getAllByText('Load')).toHaveLength(1);
      });

      it('Should display a button to send image to gallery', () => {
        expect(screen.getAllByText('Send to gallery')).toHaveLength(1);
        // TODO: once we implement this, we may be able to actually test that it works
        // since it shouldn't rely on any CanvasDraw functionality
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
