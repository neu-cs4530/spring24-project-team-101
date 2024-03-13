import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import ConnectFourAreaController, {
  ConnectFourCell,
} from '../../../classes/interactable/ConnectFourAreaController';
import React, { useRef, useState } from 'react';
import { ConnectFourColIndex } from '../../../types/CoveyTownSocket';
import CanvasDraw from 'react-canvas-draw';

export default function DrawingCanvas(): JSX.Element {
  const [color, setColor] = useState('#000000');
  const [radius, setRadius] = useState(10);
  const [saveData, setSaveData] = useState('');
  const canvas = new CanvasDraw({
    hideGrid: true,
    brushColor: color,
    brushRadius: radius,
    lazyRadius: 0,
  });
  const canvasRef = useRef(canvas);

  //const canvas = <CanvasDraw hideGrid brushColor={color} brushRadius={radius} lazyRadius={0}></CanvasDraw>;

  return (
    <div>
      <CanvasDraw
        ref={canvasRef}
        hideGrid
        brushColor={color}
        brushRadius={radius}
        lazyRadius={0}></CanvasDraw>
      <Button
        onClick={() => {
          setColor('#000000');
        }}>
        Draw
      </Button>
      <Button
        onClick={() => {
          setColor('#ffffff');
        }}>
        Erase
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
      <Button
        onClick={() => {
          setSaveData(canvasRef.current.getSaveData());
        }}>
        Save
      </Button>
      <Button
        onClick={() => {
          canvasRef.current.loadSaveData(saveData, true);
        }}>
        Load
      </Button>
      {/* <Button
        onClick={() => {
          // following https://github.com/embiem/react-canvas-draw/issues/143
          // @ts-ignore: Unreachable code error
          const url = canvasRef.current.getDataUrl('png', false, '#ffffff');
          // problem: still thinks that methods doesn't exist, but I can see it in the source code...
          window.open(url);
        }}>
        Download
      </Button> */}
    </div>
  );
}
