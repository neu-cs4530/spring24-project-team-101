import InvalidParametersError, { INVALID_COMMAND_MESSAGE } from '../lib/InvalidParametersError';
import Player from '../lib/Player';
import {
  Drawing,
  DrawingArea as DrawingAreaModel,
  InteractableCommand,
  InteractableCommandReturnType,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class DrawingArea extends InteractableArea {
  public toModel(): DrawingAreaModel {
    return {
      id: this.id,
      drawing: this._drawing,
      occupants: this.occupantsByID,
      type: 'DrawingArea',
    };
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'SaveDrawing') {
      const drawing = this._drawing;
      if (!drawing) {
        throw new InvalidParametersError('No drawing to save');
      }
      drawing.save();
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }

  /* The drawing in the area, or undefined if it is not set */
  public _drawing?: Drawing;

  /** The drawing area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
  }
}
