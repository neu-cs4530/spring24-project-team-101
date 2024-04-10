import assert from 'assert';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import {
  GameResult,
  GameStatus,
  PlayerID,
  TelestrationsAction,
  TelestrationsMove,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import { NO_GAME_IN_PROGRESS_ERROR } from './GameAreaController';
import TelestrationsAreaController from './TelestrationsAreaController';

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

  /**
   * Appends the move to the given chain.
   */
  function updateGameWithMove(
    controller: TelestrationsAreaController,
    nextMove: TelestrationsMove,
    chainIndex: number,
  ): void {
    const nextState = Object.assign({}, controller.toInteractableAreaModel());
    const nextGame = Object.assign({}, nextState.game);
    nextState.game = nextGame;
    const newState = Object.assign({}, nextGame.state);
    nextGame.state = newState;

    if (chainIndex === 0) {
      newState.chains = [
        newState.chains[chainIndex].concat(nextMove),
        ...newState.chains.slice(chainIndex + 1),
      ];
    } else if (chainIndex === newState.chains.length - 1) {
      newState.chains = [
        ...newState.chains.slice(0, chainIndex),
        newState.chains[chainIndex].concat(nextMove),
      ];
    } else {
      newState.chains = [
        ...newState.chains.slice(0, chainIndex),
        newState.chains[chainIndex].concat(nextMove),
        ...newState.chains.slice(chainIndex + 1),
      ];
    }

    nextGame.state = newState;

    controller.updateFrom(nextState, controller.occupants);
  }

  /**
   * Appends a list of moves to the game.
   * Assumes that there is one move given for each player, in order.
   */
  function updateGameWithMoves(
    controller: TelestrationsAreaController,
    nextMoves: TelestrationsMove[],
  ): void {
    const nextState = Object.assign({}, controller.toInteractableAreaModel());
    const nextGame = Object.assign({}, nextState.game);
    nextState.game = nextGame;
    const newState = Object.assign({}, nextGame.state);
    nextGame.state = newState;
    newState.chains = newState.chains.map((chain, i) => chain.concat(nextMoves[i]));
    nextGame.state = newState;

    controller.updateFrom(nextState, controller.occupants);
  }

  function teleMove(
    action: TelestrationsAction,
    word?: string,
    drawString?: string,
  ): TelestrationsMove {
    const drawing = drawString
      ? { authorID: 'a', drawingID: 'b', userDrawing: drawString }
      : undefined;
    return {
      gamePiece: 'STUB',
      action,
      word,
      drawing,
    };
  }

  function telestrationsAreaControllerWithProps({
    _id,
    undefinedGame,
    history,
    status,
    chains,
    activeChains,
    gameInstanceID,
    observers,
    playersInGameFlag,
    playersInGame,
  }: {
    _id?: string;
    undefinedGame?: boolean;
    playersInGameFlag?: boolean;
    status?: GameStatus;
    history?: GameResult[];
    gameInstanceID?: string;
    chains?: readonly TelestrationsMove[][];
    activeChains?: number[];
    observers?: string[];
    playersInGame?: PlayerID[];
  }) {
    const id = _id || `INTERACTABLE-ID-${nanoid()}`;
    const instanceID = gameInstanceID || `GAME-INSTANCE-ID-${nanoid()}`;
    const players = playersInGame || [];
    if (playersInGameFlag) {
      players.push(ourPlayer.id);
      if (observers) {
        players.push(...observers);
      }
    }
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
                players: playersInGame || [],
                chains: chains || players.map(() => []),
                activeChains: activeChains || players.map((p, i) => i),
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

  describe('gamePhase', () => {
    it('returns PICK_WORD if there is no game', () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'IN_PROGRESS',
        playersInGameFlag: true,
      });
      expect(controller.gamePhase).toBe('PICK_WORD');
    });
  });

  describe('status', () => {
    it('returns the current status of the game', () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'IN_PROGRESS',
        playersInGameFlag: true,
      });
      expect(controller.status).toBe('IN_PROGRESS');
    });
    it('returns WAITING_FOR_PLAYERS if there is no game', () => {
      const controller = telestrationsAreaControllerWithProps({
        undefinedGame: true,
      });
      expect(controller.status).toBe('WAITING_FOR_PLAYERS');
    });
  });

  describe('wordToDraw', () => {
    it('returns undefined if there is no previous word in the chain', () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'IN_PROGRESS',
        playersInGameFlag: true,
      });
      expect(controller.wordToDraw).toBe(undefined);
    });
  });

  describe('imageToGuess', () => {
    it('returns undefined if there is no previous drawing in the chain', () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'IN_PROGRESS',
        playersInGameFlag: true,
      });
      expect(controller.imageToGuess).toBe(undefined);
    });
  });

  describe('startGame', () => {
    it('sends a StartGame command to the server', async () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'WAITING_TO_START',
      });
      const instanceID = nanoid();
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
        return { gameID: instanceID };
      });
      await controller.joinGame();

      mockTownController.sendInteractableCommand.mockClear();
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {});
      await controller.startGame();
      expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
        type: 'StartGame',
        gameID: instanceID,
      });
    });
    it('Does not catch any errors from the server', async () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'WAITING_TO_START',
      });
      const instanceID = nanoid();
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
        return { gameID: instanceID };
      });
      await controller.joinGame();

      mockTownController.sendInteractableCommand.mockClear();
      const uniqueError = `Test Error ${nanoid()}`;
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
        throw new Error(uniqueError);
      });
      await expect(() => controller.startGame()).rejects.toThrowError(uniqueError);
      expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
        type: 'StartGame',
        gameID: instanceID,
      });
    });
    it('throws an error if the game is not startable', async () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'IN_PROGRESS',
      });
      const instanceID = nanoid();
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
        return { gameID: instanceID };
      });
      await controller.joinGame();
      mockTownController.sendInteractableCommand.mockClear();
      await expect(controller.startGame()).rejects.toThrowError();
      expect(mockTownController.sendInteractableCommand).not.toHaveBeenCalled();
    });
    it('throws an error if there is no instanceid', async () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'WAITING_TO_START',
      });
      mockTownController.sendInteractableCommand.mockClear();
      await expect(controller.startGame()).rejects.toThrowError();
      expect(mockTownController.sendInteractableCommand).not.toHaveBeenCalled();
    });
  });

  describe('ourChain', () => {
    it('returns undefined if there is no game', () => {
      const controller = telestrationsAreaControllerWithProps({
        undefinedGame: true,
      });
      expect(controller.ourChain).toBe(undefined);
    });
  });

  describe('makeMove', () => {
    it('Throws an error if there is no game', async () => {
      const controller = telestrationsAreaControllerWithProps({
        undefinedGame: true,
      });
      await expect(() => controller.makeMove('testFake')).rejects.toThrowError(
        NO_GAME_IN_PROGRESS_ERROR,
      );
    });
    it('Throws an error if game status is not IN_PROGRESS', async () => {
      const controller = telestrationsAreaControllerWithProps({
        status: 'WAITING_TO_START',
      });
      await expect(() => controller.makeMove('testFake')).rejects.toThrowError(
        NO_GAME_IN_PROGRESS_ERROR,
      );
    });
  });

  describe('updateFrom', () => {
    let controller: TelestrationsAreaController;
    beforeEach(() => {
      controller = telestrationsAreaControllerWithProps({
        playersInGame: otherPlayers.map(pc => pc.id),
        playersInGameFlag: true,
        status: 'IN_PROGRESS',
      });
    });

    describe('updating isOurTurn', () => {
      it('stops being our turn after making a move', () => {
        expect(controller.isOurTurn).toBeTruthy();
        updateGameWithMove(controller, teleMove('PICK_WORD', 'a'), 2);
      });
      it('becomes our turn again after all players have made a move', () => {
        expect(controller.isOurTurn).toBeTruthy();
        updateGameWithMove(controller, teleMove('PICK_WORD', 'a'), 2);
        expect(controller.isOurTurn).toBeFalsy();
        updateGameWithMove(controller, teleMove('PICK_WORD', 'a'), 0);
        expect(controller.isOurTurn).toBeFalsy();
        updateGameWithMove(controller, teleMove('PICK_WORD', 'a'), 1);
      });
    });

    describe('updating gamePhase', () => {
      it('cycles the gamePhase correctly after every round', () => {});
      it('returns the current phase of the game', () => {
        const pick = teleMove('PICK_WORD', 'a');
        const draw = teleMove('DRAW', undefined, 'a');
        const guess = teleMove('GUESS', 'a');
        expect(controller.gamePhase).toBe('PICK_WORD');
        updateGameWithMoves(controller, [pick, pick, pick]);

      });
    });

    describe('updating status', () => {
      it('updates the status when the game starts', () => {});
      it('updates the status when the game ends', () => {});
    });

    describe('updating ourChain', () => {
      it('returns the appropriate chain', () => {});
      it('updates the chains correctly after a move', () => {});
    });

    describe('updating wordToDraw', () => {
      it('updates the word after a more recent one has been supplied', () => {});
      it('returns the previous word in the chain', async () => {});
    });

    describe('updating imageToGuess', () => {
      it('updates the word after a more recent one has been supplied', () => {});
      it('returns the previous drawing in the chain', () => {});
    });

    describe('updating ourChain', () => {
      it('updates our chain as players contribute to it', () => {});
    });
  });
});
