import { Drawing, DrawingGameState, GameArea, GameStatus } from '../../types/CoveyTownSocket';
import { useState, useEffect } from 'react';
import GameAreaController, { GameEventTypes } from './GameAreaController';
import _ from 'lodash';

export type DrawingEvents = GameEventTypes & {
  drawingsChanged: (drawings: Drawing[]) => void;
};

export default class DrawingAreaController extends GameAreaController<
  DrawingGameState,
  GameEventTypes
> {
  protected _drawings: Drawing[] = [];

  get drawings(): Drawing[] {
    return this._drawings;
  }

  get status(): GameStatus {
    const status = this._model.game?.state.status;
    if (!status) {
      return 'IN_PROGRESS';
    }
    return status;
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
    const instanceID = this._instanceID;
    if (!instanceID) {
      throw new Error('No active drawings area');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'SaveDrawing',
      gameID: instanceID,
      drawing,
    });
  }

  public async toggleMode(): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID) {
      throw new Error('No active drawings area');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'ToggleMode',
      gameID: instanceID,
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
    area.addListener('drawingsUpdated', setDrawings);
    return () => {
      area.removeListener('drawingsUpdated', setDrawings);
    };
  }, [area]);

  return drawings;
}
