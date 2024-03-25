import DrawingCanvas from './DrawingCanvas';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';
import { InteractableID } from '../../../types/CoveyTownSocket';
import { useInteractableAreaController } from '../../../classes/TownController';

export default function DrawingArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const drawingAreaController =
    useInteractableAreaController<DrawingAreaController>(interactableID);

  return (
    <>
      <h3>Drawing Area</h3>
      <DrawingCanvas controller={drawingAreaController} />
    </>
  );
}
