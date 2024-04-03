import { Button, Image, List, ListItem } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import DrawingAreaController, {
  useDrawings,
} from '../../../classes/interactable/DrawingAreaController';
import { useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { Drawing, InteractableID } from '../../../types/CoveyTownSocket';
import DrawingCanvas from './DrawingCanvas';

export default function DrawingsArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController = useInteractableAreaController<DrawingAreaController>(interactableID);
  const townController = useTownController();
  //const [drawings, setDrawings] = useState<Drawing[]>(gameAreaController.drawings);
  const [nowDrawing, setNowDrawing] = useState(true);
  const drawings = useDrawings(gameAreaController);

  //   useEffect(() => {
  //     // const updateDrawings = (newDrawings: Drawing[]) => {
  //     //   setDrawings(newDrawings);
  //     // };
  //     gameAreaController.addListener('drawingsChanged', setDrawings);
  //     return () => {
  //       gameAreaController.removeListener('drawingsChanged', setDrawings);
  //     };
  //   }, [gameAreaController]);

  /**
   * Gets the username corresponding to the drawing's author id, if the
   * player is still in the town, or the id itself otherwise.
   * @param drawing the drawing to get the author id from
   * @returns the name to display underneath an image
   */
  const getUsername = (drawing: Drawing) => {
    let username = '';
    try {
      username = townController.getPlayer(drawing.authorID).userName;
    } catch (err) {
      username = drawing.authorID;
    }
    return username;
  };

  let displayComponent = <></>;
  if (!nowDrawing) {
    displayComponent = (
      <List>
        {drawings.map(drawing => {
          return (
            <ListItem key={drawing.drawingID}>
              <Image src={drawing.userDrawing}></Image>
              <p>By {getUsername(drawing)}</p>
            </ListItem>
          );
        })}
      </List>
    );
  } else {
    displayComponent = (
      <DrawingCanvas
        controller={gameAreaController}
        townController={townController}></DrawingCanvas>
    );
  }

  return (
    <>
      {displayComponent}
      <Button
        onClick={() => {
          setNowDrawing(!nowDrawing);
        }}>
        Switch to {!nowDrawing ? 'drawing canvas' : 'gallery'}
      </Button>
    </>
  );
}
