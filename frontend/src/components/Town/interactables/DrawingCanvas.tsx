import { Button, useToast } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import CanvasDraw from './react-canvas-draw/src/index';
import { CirclePicker, ColorResult } from 'react-color';
import GameAreaController, {
  GameEventTypes,
} from '../../../classes/interactable/GameAreaController';
import { GameState } from '../../../types/CoveyTownSocket';
import DrawingAreaController from '../../../classes/interactable/DrawingArea/DrawingAreaController';
import { nanoid } from 'nanoid';
import TelestrationsAreaController from '../../../classes/interactable/Telestrations/TelestrationsAreaController';
/**
 * DrawingCanvasProps are the props of the DrawingCanvas component.
 */
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
/**
 * DrawingCanvas component that allows users to draw on a canvas
 * @param controller the controller for the drawing area
 * @param authorID the id of the author of the drawing
 * @returns a DrawingCanvas component
 */
export default function DrawingCanvas({ controller, authorID }: DrawingCanvasProps): JSX.Element {
  const [color, setColor] = useState('#000000');
  const [radius, setRadius] = useState(10);
  const [erase, setErase] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  //frame options for the drawing
  const frameOptions = [
    { id: 'none', label: 'No Frame', imageUrl: '' },
    {
      id: 'frame1',
      label: 'Classic Frame',
      imageUrl: '/images/rsz_pngtree-metallic-gold-picture-frame-3d-png-image_10462872.png',
    },
    {
      id: 'frame2',
      label: 'Fancy Frame',
      imageUrl: '/images/fancy.jpeg',
    },
    {
      id: 'frame3',
      label: 'Modern Frame',
      imageUrl: '/images/plainframe.jpeg',
    },
  ];
  //boolean to determine if the canvas is for telestrations
  let telestrations: boolean;
  const controllerType = controller.toInteractableAreaModel().type;
  if (controllerType === 'DrawingArea') {
    telestrations = false;
  } else if (controllerType === 'TelestrationsArea') {
    telestrations = true;
  } else {
    throw new Error('Invalid controller type');
  }
  //canvas object
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

  /**
   *  Finalize the image and send it to the gallery
   * @param imageUrl the final image URL to send
   */
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
  /**
   * Send the drawing to the gallery
   * @returns void
   */
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
    offscreenCanvas.height = canvasRef.current.props.canvasHeight || 200;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (selectedFrame.id !== 'none' && offscreenCtx) {
      // If a frame is selected, load the frame image
      const frameImage = new window.Image();
      frameImage.onload = () => {
        // Draw the frame to fill the entire off-screen canvas
        offscreenCtx.drawImage(frameImage, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        const drawingImage = new window.Image();
        drawingImage.onload = async () => {
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
          await finalizeImage(offscreenCanvas.toDataURL('image/png'));
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
  //return the canvas and the buttons
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
            (controller as DrawingAreaController).saveData = canvasRef.current.getSaveData();
          }}>
          Save
        </Button>
      )}
      {telestrations ? (
        <></>
      ) : (
        <Button
          onClick={() => {
            const data = (controller as DrawingAreaController).saveData;
            if (data.length > 0) {
              canvasRef.current.loadSaveData(data, true);
            }
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
        <Button onClick={onOpen} disabled={loading}>
          Send to Gallery
        </Button>
      )}
      {telestrations ? (
        <></>
      ) : (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Choose a Frame</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {frameOptions.map(frame => (
                <Button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame)}
                  m={2}
                  colorScheme={selectedFrame.id === frame.id ? 'blue' : 'gray'} // Highlight selected frame
                  variant={selectedFrame.id === frame.id ? 'solid' : 'outline'}>
                  {frame.label}
                  {frame.imageUrl && (
                    <Image src={frame.imageUrl} alt={frame.label} boxSize='30px' ml={2} />
                  )}
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
      )}
    </div>
  );
}
