import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import ConnectFourAreaController, {
  ConnectFourCell,
} from '../../../classes/interactable/ConnectFourAreaController';
import React, { useRef, useState } from 'react';
import { ConnectFourColIndex } from '../../../types/CoveyTownSocket';
import CanvasDraw from './react-canvas-draw/src/index';
import { CirclePicker, CompactPicker, PhotoshopPicker } from 'react-color';

export type DrawingCanvasProps = {
  telestrations?: boolean;
};

export default function DrawingCanvas({ telestrations = false }: DrawingCanvasProps): JSX.Element {
  const [color, setColor] = useState('#000000');
  const [radius, setRadius] = useState(10);
  const [erase, setErase] = useState(false);
  const [saveData, setSaveData] = useState('');
  const canvas = new CanvasDraw({
    hideGrid: true,
    brushColor: color,
    brushRadius: radius,
    lazyRadius: 0,
  });
  const canvasRef = useRef(canvas);
  // @ts-ignore
  const handleColorChange = ({ hex }) => setColor(hex);

  return (
    <div>
      <CanvasDraw
        ref={canvasRef}
        hideGrid
        brushColor={erase ? '#ffffff' : color}
        brushRadius={radius}
        lazyRadius={0}></CanvasDraw>
      <CirclePicker
        aria-label='color picker'
        colors={[
          '#000000',
          '#999999',
          '#8B572A',
          '#D0021B',
          '#FF6900',
          '#F8E71C',
          '#68BC00',
          '#009688',
          '#03A9F4',
          '#004DCF',
          '#9013FE',
          '#FA28FF',
        ]}
        onChangeComplete={handleColorChange}></CirclePicker>
      <Button
        aria-label='toggle erase'
        onClick={() => {
          setErase(!erase);
        }}>
        {erase ? 'Draw' : 'Erase'}
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
      {telestrations ? (
        <></>
      ) : (
        <Button
          onClick={() => {
            setSaveData(canvasRef.current.getSaveData());
          }}>
          Save
        </Button>
      )}
      {telestrations ? (
        <></>
      ) : (
        <Button
          onClick={() => {
            canvasRef.current.loadSaveData(saveData, true);
          }}>
          Load
        </Button>
      )}
      {telestrations ? (
        <></>
      ) : (
        <Button
          onClick={() => {
            const url = canvasRef.current.getDataURL('png', false, '#ffffff');
            // from https://learnreactui.dev/contents/how-to-download-a-file-in-react
            const link = document.createElement('a');
            link.href = url;
            link.download = 'covey-town-drawing';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}>
          Download
        </Button>
      )}
      {telestrations ? (
        <></>
      ) : (
        <Button
          onClick={() => {
            const url = canvasRef.current.getDataURL('png', false, '#ffffff');
            console.log('send image to gallery not implemented');
          }}>
          Send to gallery
        </Button>
      )}
    </div>
  );
}