import { InteractableCommand, Drawing } from '../../types/CoveyTownSocket';
import InteractableAreaController, {
  BaseInteractableEventMap,
  DRAWING_AREA_TYPE,
} from './InteractableAreaController';
import { DrawingArea as DrawingAreaModel } from '../../types/CoveyTownSocket';
import { useState, useEffect } from 'react';
import { NO_TOPIC_STRING } from './ConversationAreaController';

export type DrawingEvents = BaseInteractableEventMap & {
  drawingChanged: (drawing: Drawing) => void;
};

// The special string that will be displayed when a drawing area does not have a drawing set
export const NO_DRAWING_STRING = '(No Drawing)';

class DrawingAreaController extends InteractableAreaController<DrawingEvents, DrawingAreaModel> {
  protected _drawing;

  constructor(id: string, drawing?: Drawing) {
    super(id);
    this._drawing = drawing;
  }

  toInteractableAreaModel(): DrawingAreaModel {
    return {
      type: 'DrawingArea',
      id: this.id,
      occupants: this.occupants.map(player => player.id),
      drawing: this._drawing,
    };
  }

  protected _updateFrom(newModel: DrawingAreaModel): void {
    this._drawing = newModel.drawing;
  }

  public isActive(): boolean {
    return this._drawing !== undefined && this.occupants.length > 0;
  }

  public get friendlyName(): string {
    return `${this.id}: Drawing ${
      this._drawing !== undefined ? this._drawing.drawingID : NO_DRAWING_STRING
    }`;
  }

  get drawing(): Drawing | undefined {
    return this._drawing;
  }

  public get type(): string {
    return DRAWING_AREA_TYPE;
  }
}

/**
 * A react hook to retrieve the topic of a ConversationAreaController.
 * If there is currently no topic defined, it will return NO_TOPIC_STRING.
 *
 * This hook will re-render any components that use it when the topic changes.
 */
export function useDrawingAreaDrawing(area: DrawingAreaController): Drawing | undefined {
  const [drawing, setDrawing] = useState(area.drawing);
  useEffect(() => {
    area.addListener('drawingChange', setDrawing);
    return () => {
      area.removeListener('drawingChange', setDrawing);
    };
  }, [area]);

  return drawing;
}
