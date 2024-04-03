import { Drawing, DrawingGameState, GameArea, GameStatus } from '../../types/CoveyTownSocket';
import { useState, useEffect } from 'react';
import GameAreaController, { GameEventTypes } from './GameAreaController';
import _ from 'lodash';

export type DrawingEvents = GameEventTypes & {
  drawingsChanged: (drawings: Drawing[]) => void;
  modeChanged: (mode: GameStatus) => void;
};

export default class DrawingAreaController extends GameAreaController<
  DrawingGameState,
  GameEventTypes
> {
  protected _drawings: Drawing[] = [];

  protected _status: GameStatus = 'IN_PROGRESS';

  get drawings(): Drawing[] {
    return this._drawings;
  }

  get status(): GameStatus {
    return this._status;
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
      const newStatus = newGame.state.status;
      if (newStatus !== this._status) {
        this._status = newStatus;
        this.emit('modeChanged', this._status);
      }
    }
  }

  public async makeMove(drawing: Drawing): Promise<void> {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'SaveDrawing',
      drawing,
    });
  }

  public async toggleMode(): Promise<void> {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'ToggleMode',
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
