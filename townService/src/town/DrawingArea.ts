import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import InvalidParametersError, { INVALID_COMMAND_MESSAGE } from '../lib/InvalidParametersError';
import Player from '../lib/Player';
import {
  BoundingBox,
  Drawing,
  DrawingArea as DrawingAreaModel,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableID,
  TownEmitter,
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
      // potentially send the image somewhere
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'ExitDrawing') {
      const drawing = this._drawing;
      if (!drawing) {
        throw new InvalidParametersError('No drawing to exit');
      }
      drawing.exit();
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

  /**
   * Creates a new Drawing Area object that will represent a Conversation Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this conversation area exists
   * @param broadcastEmitter An emitter that can be used by this conversation area to broadcast updates
   * @returns
   */
  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): DrawingArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new DrawingArea(name as InteractableID, rect, broadcastEmitter);
  }
}
