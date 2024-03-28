// import { ChakraProvider } from '@chakra-ui/react';
// import React from 'react';
// import { render, screen } from '@testing-library/react';
// import DrawingArea from './DrawingArea';
// import { nanoid } from 'nanoid';
// import TownControllerContext from '../../../contexts/TownControllerContext';
// import { mock } from 'jest-mock-extended';
// import TownController, * as TownControllerHooks from '../../../../classes/TownController';

// const townController = mock<TownController>();
// const mockGameArea = mock<DrawingArea>();
// mockGameArea.getData.mockReturnValue('DrawingArea');
// jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
// const useInteractableAreaControllerSpy = jest.spyOn(
//   TownController,
//   'useInteractableAreaController',
// );

describe('DrawingArea', () => {
  // beforeEach(() => {
  //   return render(
  //     <ChakraProvider>
  //       <TownControllerContext.Provider value={townController}>
  //         <DrawingArea interactableID={nanoid()} />
  //       </TownControllerContext.Provider>
  //     </ChakraProvider>,
  //   );
  // });

  it('should display the title', () => {
    // expect(screen.getAllByText('Drawing Area')).toHaveLength(1);
  });

  it('should display the drawing canvas', () => {
    // expect(screen.getAllByLabelText('drawing canvas')).toHaveLength(1);
  });
});
