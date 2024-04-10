import { Drawing, DrawingGameState, GameArea } from '../../../types/CoveyTownSocket';
import { useState, useEffect } from 'react';
import GameAreaController, { GameEventTypes } from '../GameAreaController';
import _ from 'lodash';

export type DrawingEvents = GameEventTypes & {
  drawingsChanged: (drawings: Drawing[]) => void;
};

export default class DrawingAreaController extends GameAreaController<
  DrawingGameState,
  GameEventTypes
> {
  protected _drawings: Drawing[] | undefined = this._model.game?.state.drawings.map(
    drawing => drawing,
  );

  protected _saveData = '';

  get drawings(): Drawing[] {
    if (!this._drawings) {
      return [];
    }
    return this._drawings;
  }

  get saveData(): string {
    return this._saveData;
  }

  set saveData(saveData: string) {
    this._saveData = saveData;
  }

  public isActive(): boolean {
    return this.occupants.length > 0;
  }

  public isEmpty(): boolean {
    return this.occupants.length === 0;
  }

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
