import { Button, Image, List, ListItem } from '@chakra-ui/react';
import React, { useState } from 'react';
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
  const [nowDrawing, setNowDrawing] = useState(true);
  const drawings = useDrawings(gameAreaController);

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
  const formatDate = (date: number | Date | undefined) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    }).format(date);

  let displayComponent = <></>;
  if (!nowDrawing) {
    const flipDrawings = [...drawings];
    flipDrawings.reverse();
    displayComponent = (
      <List>
        {flipDrawings.map(drawing => {
          return (
            <ListItem key={drawing.drawingID}>
              <Image src={drawing.userDrawing}></Image>
              <p>
                By {getUsername(drawing)} on {formatDate(new Date())}
              </p>
            </ListItem>
          );
        })}
      </List>
    );
  } else {
    displayComponent = (
      <DrawingCanvas
        controller={gameAreaController}
        authorID={townController.ourPlayer.id}></DrawingCanvas>
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
