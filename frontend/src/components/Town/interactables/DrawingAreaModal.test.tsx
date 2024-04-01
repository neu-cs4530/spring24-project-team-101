import React from 'react';
import { render, screen } from '@testing-library/react';
import DrawingArea from './DrawingArea';
import { nanoid } from 'nanoid';

describe('DrawingArea', () => {
  beforeEach(() => {
    render(<DrawingArea interactableID={nanoid()} />);
  });

  it('should display the title', () => {
    expect(screen.getAllByText('Drawing Area')).toHaveLength(1);
  });

  it('should display the drawing canvas', () => {
    expect(screen.getAllByLabelText('drawing canvas')).toHaveLength(1);
  });
});
