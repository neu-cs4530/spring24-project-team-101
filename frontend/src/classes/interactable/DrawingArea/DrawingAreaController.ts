import { Drawing, DrawingGameState, GameArea } from '../../../types/CoveyTownSocket';
import { useState, useEffect } from 'react';
import GameAreaController, { GameEventTypes } from '../GameAreaController';
import _ from 'lodash';

/**
 * DrawingEvents are the events that can be emitted by a DrawingAreaController.
 */
export type DrawingEvents = GameEventTypes & {
  drawingsChanged: (drawings: Drawing[]) => void;
};

/**
 * A DrawingAreaController manages the local behavior of a Drawing Area in the frontend,
 */
export default class DrawingAreaController extends GameAreaController<
  DrawingGameState,
  GameEventTypes
> {
  /**
   * The list of drawings present in this Drawing/Gallery Area.
   */
  protected _drawings: Drawing[] | undefined = this._model.game?.state.drawings.map(
    drawing => drawing,
  );

  /**
   * The save data for the drawing area.
   */
  protected _saveData = '';

  /**
   * Get the list of drawings present in this Drawing/Gallery Area.
   */
  get drawings(): Drawing[] {
    if (!this._drawings) {
      return [];
    }
    return this._drawings;
  }

  /**
   * Get the save data for the drawing area.
   */
  get saveData(): string {
    return this._saveData;
  }

  /**
   * Set the save data for the drawing area.
   */
  set saveData(saveData: string) {
    this._saveData = saveData;
  }

  /**
   * Is this Drawing Area active?
   * @returns true if the Drawing Area is active, false otherwise.
   */
  public isActive(): boolean {
    return this.occupants.length > 0;
  }

  /**
   * Is this Drawing Area empty?
   * @returns true if the Drawing Area is empty, false otherwise.
   */
  public isEmpty(): boolean {
    return this.occupants.length === 0;
  }

  /**
   * Update the state of this interactable area from a new interactable area model.
   * @param newModel the new model to update from
   */
  protected _updateFrom(newModel: GameArea<DrawingGameState>): void {
    super._updateFrom(newModel);
    const newGame = newModel.game;
    if (newGame) {
      let newDrawings: Drawing[] = [];
      newGame.state.drawings.forEach(drawing => {
        newDrawings = newDrawings.concat(drawing);
      });
      if (!_.isEqual(newDrawings, this._drawings)) {
        this._drawings = newDrawings;
        this.emit('drawingsChanged', this._drawings);
      }
    }
  }

  /**
   * Make a move in the Drawing Area.
   * @param drawing save the drawing to the drawing area
   */
  public async makeMove(drawing: Drawing): Promise<void> {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'SaveDrawing',
      drawing,
    });
  }
}

/**
 * A react hook to retrieve the current list of drawings present in this
 * Drawing/Gallery Area.
 *
 * This hook will re-render any components that use it when the topic changes.
 */
export function useDrawings(area: DrawingAreaController): Drawing[] {
  const [drawings, setDrawings] = useState(area.drawings);
  useEffect(() => {
    area.addListener('drawingsChanged', setDrawings);
    return () => {
      area.removeListener('drawingsChanged', setDrawings);
    };
  }, [area]);

  return drawings;
}
