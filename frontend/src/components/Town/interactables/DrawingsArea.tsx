import { Button, Image, List, ListItem } from '@chakra-ui/react';
import React from 'react';
import DrawingAreaController, {
  useDrawings,
} from '../../../classes/interactable/DrawingAreaController';
import { useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { InteractableID } from '../../../types/CoveyTownSocket';
import DrawingCanvas from './DrawingCanvas';

export default function DrawingsArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController = useInteractableAreaController<DrawingAreaController>(interactableID);
  const townController = useTownController();
  const drawings = useDrawings(gameAreaController);

  const nowDrawing = !(gameAreaController.status === 'OVER');

  let displayComponent = <></>;
  if (nowDrawing) {
    displayComponent = (
      <DrawingCanvas
        controller={gameAreaController}
        townController={townController}></DrawingCanvas>
    );
  } else {
    displayComponent = (
      <List>
        {drawings.map(drawing => (
          <ListItem key={drawing.drawingID}>
            <Image src={drawing.userDrawing}></Image>
            <p>By {drawing.authorID}</p>
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <>
      {displayComponent}
      <Button
        onClick={() => {
          gameAreaController.toggleMode();
        }}>
        Switch to {nowDrawing ? 'gallery' : 'drawing canvas'}
      </Button>
    </>
  );
}
