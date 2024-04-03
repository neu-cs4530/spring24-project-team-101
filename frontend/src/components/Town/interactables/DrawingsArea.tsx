import { Button, Image, List, ListItem } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';
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
  const [drawings, setDrawings] = useState<Drawing[]>(gameAreaController.drawings);
  const [nowDrawing, setNowDrawing] = useState(true);

  useEffect(() => {
    const updateDrawings = (newDrawings: Drawing[]) => {
      setDrawings(newDrawings);
    };
    gameAreaController.addListener('drawingsChanged', updateDrawings);
    return () => {
      gameAreaController.removeListener('drawingsChanged', updateDrawings);
    };
  }, [gameAreaController]);

  let displayComponent = <></>;
  if (!nowDrawing) {
    displayComponent = (
      <List>
        {drawings.map(drawing => {
          return (
            <ListItem key={drawing.drawingID}>
              <Image src={drawing.userDrawing}></Image>
              <p>By {townController.getPlayer(drawing.authorID).userName}</p>
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
