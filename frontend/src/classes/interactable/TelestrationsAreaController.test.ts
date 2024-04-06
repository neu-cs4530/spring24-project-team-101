import assert from "assert";
import { mock } from "jest-mock-extended";
import { before } from "lodash";
import { nanoid } from "nanoid";
import { string } from "prop-types";
import { GameResult, GameStatus, TelestrationsMove } from "../../types/CoveyTownSocket";
import PlayerController from "../PlayerController";
import TownController from "../TownController";
import TelestrationsAreaController from "./TelestrationsAreaController";

describe('TelestrationsAreaController', () => {
    const ourPlayer = new PlayerController(nanoid(), nanoid(), {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    });
    const otherPlayers = [
      new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
      new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    ];
  
    const mockTownController = mock<TownController>();
    Object.defineProperty(mockTownController, 'ourPlayer', {
      get: () => ourPlayer,
    });
    Object.defineProperty(mockTownController, 'players', {
      get: () => [ourPlayer, ...otherPlayers],
    });
    mockTownController.getPlayer.mockImplementation(playerID => {
      const p = mockTownController.players.find(player => player.id === playerID);
      assert(p);
      return p;
    });
  
    function updateGameWithMove(
      controller: TelestrationsAreaController,
      nextMove: TelestrationsMove,
    ): void {
      const nextState = Object.assign({}, controller.toInteractableAreaModel());
      const nextGame = Object.assign({}, nextState.game);
      nextState.game = nextGame;
      const newState = Object.assign({}, nextGame.state);
      nextGame.state = newState;
      controller.updateFrom(nextState, controller.occupants);
    }
    function telestrationsAreaControllerWithProps({
      _id,
      undefinedGame,
      history,
      status,
      moves,
      activeChains,
      gameInstanceID,
      observers,
      playersInGameFlag,
    }: {
      _id?: string;
      undefinedGame?: boolean;
      playersInGameFlag?: boolean;
      status?: GameStatus;
      history?: GameResult[];
      gameInstanceID?: string;
      moves?:  readonly TelestrationsMove[][];
      activeChains?: number[];
      observers?: string[];
    }) {
      const id = _id || `INTERACTABLE-ID-${nanoid()}`;
      const instanceID = gameInstanceID || `GAME-INSTANCE-ID-${nanoid()}`;
      const players = [];
      if (playersInGameFlag){
      players.push(ourPlayer.id)
      if (observers) {
      players.push(...observers);}}
      //if (observers) players.push(...observers);
      const ret = new TelestrationsAreaController(
        id,
        {
          id,
          occupants: players,
          history: history || [],
          type: 'TelestrationsArea',
          game: undefinedGame
            ? undefined
            : {
                id: instanceID,
                players: players,
                state: {
                    status: status || 'IN_PROGRESS',
                    gamePhase: 0,
                    players: players || [],
                    chains: moves || [],
                    activeChains: activeChains || [],
                    playersReady: [],
                },
              },
        },
        mockTownController,
      );
      if (players) {
        ret.occupants = players
          .map(eachID => mockTownController.players.find(eachPlayer => eachPlayer.id === eachID))
          .filter(eachPlayer => eachPlayer) as PlayerController[];
      }
      return ret;
    }
    describe('isOurTurn', () => {
        it('returns true if it is our turn', () => {
          const controller = telestrationsAreaControllerWithProps({
            status: 'IN_PROGRESS',
            playersInGameFlag: true,
            observers: otherPlayers.map(player => player.id),
          });
          expect(controller.players.length).toBe(3);
          controller.makeMove('test')
          expect(controller.isOurTurn).toBe(true);
        });
        it('returns false if it is not our turn', () => {
          const controller = telestrationsAreaControllerWithProps({
            status: 'IN_PROGRESS',
            playersInGameFlag: false,
          });
          expect(controller.isOurTurn).toBe(false);
        });
      });

      describe('isActive', () => {

        it('returns true if the game is not empty and it is not waiting for players', () => {
          const controller = telestrationsAreaControllerWithProps({
            status: 'IN_PROGRESS',
            playersInGameFlag: true,
          });
          expect(controller.isActive()).toBe(true);
        });
        it('returns false if the game is empty', () => {
          const controller = telestrationsAreaControllerWithProps({
            status: 'IN_PROGRESS',
            playersInGameFlag: false,
          });
          expect(controller.isActive()).toBe(false);
        });
        it('returns false if the game is over', () => {
          const controller = telestrationsAreaControllerWithProps({
            status: 'OVER',
            playersInGameFlag: true,
          });
          expect(controller.isActive()).toBe(false);
        });
      });

});