import DrawingCanvas from './DrawingCanvas';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

describe('can we render the component at all?', () => {
  afterEach(cleanup);
  it('should render all the buttons', () => {
    render(<DrawingCanvas />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toEqual(6);
  });
});
