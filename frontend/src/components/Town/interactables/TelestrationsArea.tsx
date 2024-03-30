import React, { ChangeEvent, useEffect, useState } from "react";
import PlayerController from "../../../classes/PlayerController";
import { useInteractableAreaController } from "../../../classes/TownController";
import useTownController from "../../../hooks/useTownController";
import { GameStatus, InteractableID, TelestrationsAction } from "../../../types/CoveyTownSocket";
import { Button, Input, List, ListItem, toast, useToast, Image } from "@chakra-ui/react";
import DrawingCanvas from "./DrawingCanvas";

export default function ConnectFourArea({
    interactableID,
  }: {
    interactableID: InteractableID;
  }): JSX.Element {
    const gameAreaController =
      useInteractableAreaController<TelestrationsAreaController>(interactableID);
    const townController = useTownController();
    
    const [inputVal, setInputVal] = useState('');
    const [listOfPlayers, setListOfPlayers] = useState<PlayerController[]>(gameAreaController.players); //gameAreaController.players is an array of PlayerControllers
    const [joiningGame, setJoiningGame] = useState(false);
    const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
    const [gamePhase, setGamePhase] = useState<TelestrationsAction>(gameAreaController.gamePhase);
    const toast = useToast();
    useEffect(() => {
        const updateGameState = () => {
          setGameStatus(gameAreaController.status || 'WAITING_TO_START');
          setGamePhase(gameAreaController.gamePhase || 'PICK_WORD');
          setListOfPlayers(gameAreaController.players);
        };
        const onGameEnd = () => {
              toast({
                title: 'Game over',
                description: 'Nice job, everyone!',
                status: 'info',
              });
            }
        gameAreaController.addListener('gameUpdated', updateGameState);
        gameAreaController.addListener('gameEnd', onGameEnd);
        //*CONTROLLER DETERMINES WHOSE TURN IT IS
        return () => {
          gameAreaController.removeListener('gameUpdated', updateGameState);
          gameAreaController.removeListener('gameEnd', onGameEnd);
        };
      }, [townController, gameAreaController, toast]);
      let gameStatusText = <></>;
      if (gameStatus === 'IN_PROGRESS') {
        gameStatusText = (
          <>
            Game in progress, currently{' '}
            {gameAreaController.whoseTurn === townController.ourPlayer
              ? 'your'
              : gameAreaController.whoseTurn?.userName + "'s"}{' '}
            turn
          </>
        );
      }
      else if (gameStatus == 'WAITING_TO_START') {
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
        gameStatusText = <b>Waiting for players to press start. {startGameButton}</b>;
      }
      else {
        const joinGameButton = (
          <Button
            onClick={async () => {
              setJoiningGame(true);
              try {
                await gameAreaController.joinGame();
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
        let gameStatusStr;
        if (gameStatus === 'OVER') gameStatusStr = 'over';
        //may want to add option to display chains that were created
        else if (gameStatus === 'WAITING_FOR_PLAYERS') gameStatusStr = 'waiting for players to join';
        gameStatusText = (
          <b>
            Game {gameStatusStr}. {joinGameButton}
          </b>
        );
      }
      let currentPhaseComponent = <></>;
      if (gameAreaController.whoseTurn !== townController.ourPlayer) {
        currentPhaseComponent = <>... not your turn</>
      }
      else if (gamePhase === 'PICK_WORD') {
        //has to get implemented in the controller in some way
        const onChange = (event: ChangeEvent<HTMLInputElement>) => { setInputVal(event.target.value) }
        const onSubmit = () => { gameAreaController.pickWord(inputVal) }
        currentPhaseComponent = <div>
        <Input placeholder='Enter your word:' onChange={onChange}></Input>
        <Button onClick={onSubmit}>Submit</Button>
        </div>
      }
      else if (gamePhase === 'DRAW') {
        currentPhaseComponent = <DrawingCanvas telestrationsAreaController={gameAreaController} telestrations={true}></DrawingCanvas>
      }
      else if (gamePhase === 'GUESS') {
        //in order to display the image we have to receive the image from the controller
        const onChange = (event: ChangeEvent<HTMLInputElement>) => { setInputVal(event.target.value) }
        const onSubmit = () => { gameAreaController.guessDrawing(inputVal) }
        currentPhaseComponent = <div>
        <Image src={gameAreaController.imageURL}></Image>
        <Input placeholder='Enter your guess:' onChange={onChange}></Input>
        <Button onClick={onSubmit}>Submit</Button>
        </div>
      }

      return (
        <>
          {gameStatusText}
          <List aria-label='list of players in the game'>
            {listOfPlayers.map((player,index) => (<ListItem key={player.userName}>Player {index}: {player.userName}</ListItem>))}
          </List>
         {currentPhaseComponent}
        </>
      );
  }


