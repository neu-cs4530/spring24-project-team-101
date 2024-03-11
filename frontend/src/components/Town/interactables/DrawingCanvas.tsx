import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import ConnectFourAreaController, {
  ConnectFourCell,
} from '../../../classes/interactable/ConnectFourAreaController';
import React, { useEffect, useState } from 'react';
import { ConnectFourColIndex } from '../../../types/CoveyTownSocket';
import CanvasDraw from 'react-canvas-draw';

export default function DrawingCanvas(): JSX.Element {
    const [color, setColor] = useState('#ffc600');
    const [radius, setRadius] = useState(10);
  
    return (
      <div>
        <CanvasDraw hideGrid brushColor={color} brushRadius={radius} lazyRadius={0}></CanvasDraw>
        <Button
          onClick={() => {
            setColor('#' + Math.floor(Math.random() * 16777215).toString(16));
          }}>
          New color
        </Button>
        <Button
          onClick={() => {
            setRadius(Math.min(radius + 1, 50));
          }}>
          Size up
        </Button>
        <Button
          onClick={() => {
            setRadius(Math.max(radius - 1, 5));
          }}>
          Size down
        </Button>
        {
          // issue: saving/loading seem to be methods of the CanvasDrawing class, whereas everything here is functions
          // is there a good way to use class-based components inside an app that uses function-based components?
          // alternately, is there a way to use those methods regardless of the class??
        }
      </div>
    );
}
