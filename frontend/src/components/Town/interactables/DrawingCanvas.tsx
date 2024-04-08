import { Button, useToast } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import CanvasDraw from './react-canvas-draw/src/index';
import { CirclePicker, ColorResult } from 'react-color';
import GameAreaController, {
  GameEventTypes,
} from '../../../classes/interactable/GameAreaController';
import { GameState } from '../../../types/CoveyTownSocket';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';
import { nanoid } from 'nanoid';
import TelestrationsAreaController from '../../../classes/interactable/TelestrationsAreaController';

export type DrawingCanvasProps = {
  controller: GameAreaController<GameState, GameEventTypes>;
  authorID: string;
};
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
} from '@chakra-ui/react';

export default function DrawingCanvas({ controller, authorID }: DrawingCanvasProps): JSX.Element {
  const [color, setColor] = useState('#000000');
  const [radius, setRadius] = useState(10);
  const [erase, setErase] = useState(false);
  const [saveData, setSaveData] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const frameOptions = [
    { id: 'none', label: 'No Frame', imageUrl: '' },
    {
      id: 'frame1',
      label: 'Classic Frame',
      imageUrl: '/images/rsz_pngtree-metallic-gold-picture-frame-3d-png-image_10462872.png',
    },
    {
      id: 'frame2',
      label: 'Classic Frame',
      imageUrl: '/images/rsz_pngtree-metallic-gold-picture-frame-3d-png-image_10462872.png',
    },
    {
      id: 'frame3',
      label: 'Classic Frame',
      imageUrl: '/images/rsz_pngtree-metallic-gold-picture-frame-3d-png-image_10462872.png',
    },
  ];

  let telestrations: boolean;
  const controllerType = controller.toInteractableAreaModel().type;
  if (controllerType === 'DrawingArea') {
    telestrations = false;
  } else if (controllerType === 'TelestrationsArea') {
    telestrations = true;
  } else {
    throw new Error('Invalid controller type');
  }

  const canvas = new CanvasDraw({
    hideGrid: true,
    brushColor: color,
    brushRadius: radius,
    lazyRadius: 0,
  });
  const canvasRef = useRef(canvas);
  const handleColorChange = ({ hex }: ColorResult) => setColor(hex);

  // FRAME FUNCTIONALITY
  const [selectedFrame, setSelectedFrame] = useState(frameOptions[0]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const finalizeImage = async (imageUrl: string) => {
    try {
      await (controller as DrawingAreaController).makeMove({
        drawingID: nanoid(),
        authorID,
        userDrawing: imageUrl, // Use the combined image URL
      });
      toast({
        title: 'Drawing sent to gallery',
        status: 'success',
      });
      onClose(); // Close the modal after successful processing
    } catch (err) {
      toast({
        title: 'Error sending image to gallery',
        description: (err as Error).toString(),
        status: 'error',
      });
      // Do not close the modal here, allowing users to try again
    } finally {
      setLoading(false);
    }
  };
  const sendDrawingToGallery = async () => {
    if (!canvasRef.current) {
      toast({
        title: 'Error',
        description: 'Canvas not initialized',
        status: 'error',
      });
      return;
    }
    setLoading(true);
    const offscreenCanvas = document.createElement('canvas');
    const framePadding = 38; // This is the padding you want around your canvas image within the frame
    offscreenCanvas.width = canvasRef.current.props.canvasWidth || 200;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    +(2 * framePadding); // Add padding to the off-screen canvas dimensions
    offscreenCanvas.height = canvasRef.current.props.canvasHeight || 200;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    +(2 * framePadding);
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (selectedFrame.id !== 'none' && offscreenCtx) {
      const frameImage = new window.Image();
      frameImage.onload = () => {
        // Draw the frame to fill the entire off-screen canvas
        offscreenCtx.drawImage(frameImage, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        const drawingImage = new window.Image();
        drawingImage.onload = () => {
          // Calculate the position to start drawing the canvas image
          const xPosition = framePadding;
          const yPosition = framePadding;

          // Set the canvas image size smaller than the frame, subtracting the padding from both dimensions
          const canvasImageWidth = offscreenCanvas.width - 2 * framePadding;
          const canvasImageHeight = offscreenCanvas.height - 2 * framePadding;

          // Draw the canvas image centered within the frame
          offscreenCtx.drawImage(
            drawingImage,
            xPosition,
            yPosition,
            canvasImageWidth,
            canvasImageHeight,
          );
          finalizeImage(offscreenCanvas.toDataURL('image/png'));
        };
        drawingImage.src = canvasRef.current.getDataURL('png', false, '#ffffff');
      };
      frameImage.src = selectedFrame.imageUrl;
      frameImage.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to load frame image',
          status: 'error',
        });
        setLoading(false);
      };
    } else if (offscreenCtx) {
      // If 'none' is selected, just send the canvas drawing
      const drawingImage = new window.Image();
      drawingImage.onload = () => {
        offscreenCtx.drawImage(drawingImage, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
        finalizeImage(offscreenCanvas.toDataURL('image/png'));
      };
      drawingImage.src = canvasRef.current.getDataURL('png', false, '#ffffff');
    } else {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Context is not available',
        status: 'error',
      });
    }
  };

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
        <Button
          onClick={async () => {
            setLoading(true);
            const url = canvasRef.current.getDataURL('png', false, '#ffffff');
            try {
              await (controller as TelestrationsAreaController).makeMove({
                drawingID: nanoid(),
                authorID,
                userDrawing: url,
              });
            } catch (err) {
              toast({
                title: 'Error submitting drawing',
                description: (err as Error).toString(),
                status: 'error',
              });
            }
            setLoading(false);
          }}
          isLoading={loading}
          disabled={loading}>
          Submit
        </Button>
      ) : (
        <></>
      )}
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
        <div>
          <Button onClick={onOpen} disabled={loading}>
            Send to Gallery
          </Button>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Choose a Frame</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {/* Dynamically generate frame selection buttons */}
                {frameOptions.map(frame => (
                  <Button key={frame.id} onClick={() => setSelectedFrame(frame)} m={2}>
                    {frame.label}
                  </Button>
                ))}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme='blue' mr={3} onClick={sendDrawingToGallery}>
                  Send with Frame
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      )}
    </div>
  );
}
