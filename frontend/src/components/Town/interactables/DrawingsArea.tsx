import { Button, Image, List, ListItem, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import DrawingAreaController, {
  useDrawings,
} from '../../../classes/interactable/DrawingAreaController';
import { useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { Drawing, GameStatus, InteractableID } from '../../../types/CoveyTownSocket';
import DrawingCanvas from './DrawingCanvas';

export default function DrawingsArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController = useInteractableAreaController<DrawingAreaController>(interactableID);
  const townController = useTownController();
  //const drawings = useDrawings(gameAreaController);
  //const [gameStatus, setGameStatus] = useState<GameStatus>('OVER');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [nowDrawing, setNowDrawing] = useState(true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  //   useEffect(() => {
  //     const updateStatus = () => {
  //       setGameStatus(gameAreaController.status || 'OVER');
  //     };
  //     gameAreaController.addListener('gameUpdated', updateStatus);
  //     return () => {
  //       gameAreaController.removeListener('gameUpdated', updateStatus);
  //     };
  //   }, [gameAreaController]);

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
        // onClick={async () => {
        //   setLoading(true);
        //   try {
        //     await gameAreaController.toggleMode();
        //   } catch (err) {
        //     toast({
        //       title: 'Error switching between modes',
        //       description: (err as Error).toString(),
        //       status: 'error',
        //     });
        //   }
        //   console.log('sent toggleMode command to controller');
        //   setLoading(false);
        // }}
        onClick={() => {
          setNowDrawing(!nowDrawing);
        }}
        // isLoading={loading}
        // disabled={loading}
      >
        Switch to {!nowDrawing ? 'drawing canvas' : 'gallery'}
      </Button>
    </>
  );
}
