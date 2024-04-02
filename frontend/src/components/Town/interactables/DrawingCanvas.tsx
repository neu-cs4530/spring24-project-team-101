import { Button } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import CanvasDraw from './react-canvas-draw/src/index';
import { CirclePicker, ColorResult } from 'react-color';
import InteractableAreaController from '../../../classes/interactable/InteractableAreaController';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';
import TelestrationsAreaController from '../../../classes/interactable/TelestrationsAreaController';

export type DrawingCanvasProps = {
  drawingAreaController?: DrawingAreaController;
  telestrationsAreaController?: TelestrationsAreaController;
  telestrations?: boolean;
};

export default function DrawingCanvas({
  drawingAreaController = undefined,
  telestrationsAreaController = undefined,
  telestrations = false,
}: DrawingCanvasProps): JSX.Element {
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
  const handleColorChange = ({ hex }: ColorResult) => setColor(hex);

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
