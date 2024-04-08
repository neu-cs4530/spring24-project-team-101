import React, { ChangeEvent, useEffect, useState } from 'react';
import PlayerController from '../../../classes/PlayerController';
import { useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { GameStatus, InteractableID, TelestrationsAction } from '../../../types/CoveyTownSocket';
import { Button, Input, List, ListItem, useToast, Image } from '@chakra-ui/react';
import DrawingCanvas from './DrawingCanvas';
import TelestrationsAreaController from '../../../classes/interactable/TelestrationsAreaController';

export default function TelestrationsArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<TelestrationsAreaController>(interactableID);
  const townController = useTownController();

  const [inputVal, setInputVal] = useState('');
  const [listOfPlayers, setListOfPlayers] = useState<PlayerController[]>(
    gameAreaController.players,
  ); //gameAreaController.players is an array of PlayerControllers
  const [joiningGame, setJoiningGame] = useState(false);
  // Inside your component's function
  const [hasJoinedGame, setHasJoinedGame] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [gamePhase, setGamePhase] = useState<TelestrationsAction>(gameAreaController.gamePhase);
  const [wordToDraw, setWordToDraw] = useState<string | undefined>(gameAreaController.wordToDraw);
  const toast = useToast();
  useEffect(() => {
    const updateGameState = () => {
      setGameStatus(gameAreaController.status || 'WAITING_FOR_PLAYERS');
      setGamePhase(gameAreaController.gamePhase || 'PICK_WORD');
      setListOfPlayers(gameAreaController.players);
      setWordToDraw(gameAreaController.wordToDraw || '');
    };
    const onGameEnd = () => {
      toast({
        title: 'Game over',
        description: 'Nice job, everyone!',
        status: 'info',
      });
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('gameEnd', onGameEnd);
    };
  }, [townController, gameAreaController, toast]);
  let gameStatusText = <></>;
  if (gameStatus === 'IN_PROGRESS') {
    gameStatusText = (
      <p>
        <b>
          Game in progress, currently{' '}
          {gameAreaController.isOurTurn ? 'your turn' : 'you have already submitted'}{' '}
        </b>
      </p>
    );
  } else {
    const joinGameButton = (
      <Button
        onClick={async () => {
          setJoiningGame(true);
          try {
            await gameAreaController.joinGame();
            setHasJoinedGame(true); // Update state to reflect the user has joined the game
          } catch (err) {
            toast({
              title: 'Error joining game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setJoiningGame(false);
        }}
        isLoading={joiningGame}
        disabled={joiningGame}>
        Join New Game
      </Button>
    );
    const startGameButton = (
      <Button
        onClick={async () => {
          setJoiningGame(true);
          try {
            await gameAreaController.startGame();
          } catch (err) {
            toast({
              title: 'Error starting game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setJoiningGame(false);
        }}
        isLoading={joiningGame}
        disabled={joiningGame}>
        Start Game
      </Button>
    );
    let gameActionButton;

    // Adjust the condition to allow joining regardless of the game status being "WAITING_FOR_PLAYERS" or "WAITING_TO_START"
    if (!hasJoinedGame || gameStatus === 'OVER') {
      gameActionButton = joinGameButton;
    } else if (gameStatus === 'WAITING_TO_START' && hasJoinedGame) {
      gameActionButton = startGameButton;
    } else {
      gameActionButton = <></>; // Add other conditions as needed
    }
    let gameStatusStr;
    if (gameStatus === 'OVER') {
      console.log(gameStatus);
      gameStatusStr = 'over';
    }
    //may want to add option to display chains that were created
    else if (gameStatus === 'WAITING_FOR_PLAYERS') {
      gameStatusStr = 'waiting for players to join';
      gameActionButton = joinGameButton;
    } else if (gameStatus === 'WAITING_TO_START')
      gameStatusStr = 'waiting for players to press start, more players may still join';
    gameStatusText = (
      <>
        <b>Game {gameStatusStr}.</b>
        <p>{gameActionButton}</p>
      </>
    );
  }
  // Now, modify the conditional rendering to use `hasJoinedGame` to decide which button to show
  let currentPhaseComponent = <></>;
  if (!gameAreaController.isOurTurn && gameStatus === 'IN_PROGRESS') {
    currentPhaseComponent = <></>;
  } else if (gameStatus === 'OVER') {
    const chain = gameAreaController.ourChain;
    if (chain) {
      gameStatusText = <b>Game over! Here{"'"}s where your word started:</b>;

      const chainComponents = chain.map(move => {
        if (move.word) {
          return <b>{move.word}</b>;
        } else if (move.drawing) {
          return <Image src={move.drawing.userDrawing}></Image>;
        }
      });
      const joinGameButton = (
        <Button
          onClick={async () => {
            setJoiningGame(true);
            try {
              await gameAreaController.joinGame();
              setHasJoinedGame(true); // Update state to reflect the user has joined the game
            } catch (err) {
              toast({
                title: 'Error joining game',
                description: (err as Error).toString(),
                status: 'error',
              });
            }
            setJoiningGame(false);
          }}
          isLoading={joiningGame}
          disabled={joiningGame}>
          Join New Game
        </Button>
      );
      currentPhaseComponent = (
        <div>
          <>{chainComponents}</>
          <p>{joinGameButton}</p>
        </div>
      );
    }
  } else if (gameStatus === 'IN_PROGRESS' && gamePhase === 'PICK_WORD') {
    //has to get implemented in the controller in some way
    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
      setInputVal(event.target.value);
    };
    const onSubmit = () => {
      townController.unPause();
      gameAreaController.makeMove(inputVal);
    };
    currentPhaseComponent = (
      <div>
        <Input
          placeholder='Enter your word:'
          onChange={onChange}
          onClick={() => {
            townController.pause();
          }}></Input>
        <Button onClick={onSubmit}>Submit</Button>
      </div>
    );
  } else if (gamePhase === 'DRAW') {
    currentPhaseComponent = (
      <div>
        <>Draw {wordToDraw ? wordToDraw : 'NO WORD YET'}.</>
        <DrawingCanvas
          controller={gameAreaController}
          authorID={townController.userID}></DrawingCanvas>
      </div>
    );
  } else if (gamePhase === 'GUESS') {
    //in order to display the image we have to receive the image from the controller
    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
      setInputVal(event.target.value);
    };
    const onSubmit = () => {
      townController.unPause();
      gameAreaController.makeMove(inputVal);
    };
    currentPhaseComponent = (
      // TODO: fix this
      <div>
        <Image src={gameAreaController.imageToGuess?.userDrawing}></Image>
        <Input
          placeholder='Enter your guess:'
          onChange={onChange}
          onClick={() => {
            townController.pause();
          }}></Input>
        <Button onClick={onSubmit}>Submit</Button>
      </div>
    );
  }

  return (
    <>
      {gameStatus === 'OVER' ? (
        <></>
      ) : (
        <List aria-label='list of players in the game'>
          {listOfPlayers.map((player, index) => (
            <ListItem key={player.userName}>
              Player {index}: {player.userName}
            </ListItem>
          ))}
        </List>
      )}
      {gameStatusText}
      {currentPhaseComponent}
    </>
  );
}
