import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import React, { useCallback } from 'react';
import DrawingCanvas from './DrawingCanvas';
import DrawingAreaController from '../../../classes/interactable/DrawingAreaController';
import { InteractableID } from '../../../types/CoveyTownSocket';
import { useInteractable, useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import DrawingAreaInteractable from './DrawingArea';

export default function DrawingArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const drawingArea = useInteractable<DrawingAreaInteractable>('drawingArea');
  const townController = useTownController();
  const drawingAreaController =
    useInteractableAreaController<DrawingAreaController>(interactableID);
  const closeModal = useCallback(() => {
    if (drawingArea) {
      townController.interactEnd(drawingArea);
    }
  }, [townController, drawingArea]);

  return (
    <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false} size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{drawingArea?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <DrawingCanvas controller={drawingAreaController} />
          </ModalBody>
        </ModalContent>
      </Modal>
  );
}
