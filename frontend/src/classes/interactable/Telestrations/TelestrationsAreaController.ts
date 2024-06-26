import _ from 'lodash';
import {
  Drawing,
  GameArea,
  GameStatus,
  TelestrationsAction,
  TelestrationsGameState,
  TelestrationsMove,
} from '../../../types/CoveyTownSocket';
import GameAreaController, {
  GameEventTypes,
  NO_GAME_IN_PROGRESS_ERROR,
  NO_GAME_STARTABLE,
} from '../GameAreaController';

export type TelestrationsEvents = GameEventTypes & {
  chainsChanged: (chains: TelestrationsMove[][]) => void;
};

/**
 * This class is responsible for managing the state of the Telestrations game, and for sending commands to the server
 *
 */
export default class TelestrationsAreaController extends GameAreaController<
  TelestrationsGameState,
  TelestrationsEvents
> {
  public isActive(): boolean {
    return !this.isEmpty() && this.status && this.status !== 'OVER';
  }

  protected _chains: TelestrationsMove[][] = [[]];

  protected _updateFrom(newModel: GameArea<TelestrationsGameState>): void {
    super._updateFrom(newModel);
    if (newModel.game) {
      if (!_.isEqual(newModel.game.state.chains, this._chains)) {
        newModel.game?.state.chains.forEach((chain, index) => {
          this._chains[index] = [...chain];
        });
        // At the moment, this isn't very useful, because nothing ever depends on all the chains.
        // However, it could be essential for future extensions.
        this.emit('chainsChanged', this._chains);
      }
    }
  }

  // Keep an eye out for errors concerning users giving a drawing when not supposed to or vice versea
  /**
   *
   * @param input is either a string or a Drawing object, depending on the type of move the player is making
   * @returns a promise that resolves when the move is made
   */
  public async makeMove(input: Drawing | string): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    if (typeof input === 'string') {
      await this._townController.sendInteractableCommand(this.id, {
        type: 'GameMove',
        gameID: instanceID,
        move: {
          gamePiece: 'STUB',
          action: this.gamePhase,
          word: input,
        },
      });
      return;
    } else {
      await this._townController.sendInteractableCommand(this.id, {
        type: 'GameMove',
        gameID: instanceID,
        move: {
          gamePiece: 'STUB',
          action: 'DRAW',
          drawing: {
            ...input,
            authorID: this._townController.ourPlayer.id,
          },
        },
      });
      return;
    }
  }

  get gamePhase(): TelestrationsAction {
    if (!this._model.game) {
      return 'PICK_WORD';
    } else if (this._model.game?.state.gamePhase === 0) {
      return 'PICK_WORD';
    } else if (this._model.game?.state.gamePhase % 2 !== 0) {
      return 'DRAW';
    }
    return 'GUESS';
  }

  /**
   * Returns the current status of the game.
   * Starts the game in a WAITING_FOR_PLAYERS state.
   */
  get status(): GameStatus {
    if (!this._model.game) {
      return 'WAITING_FOR_PLAYERS';
    } else {
      return this._model.game?.state.status;
    }
  }

  /**
   * Returns true if it is our turn to make a move, false otherwise
   */
  get isOurTurn(): boolean {
    if (!this._model.game) {
      return false;
    } else {
      //has our town controller player drawn in this phase
      const currentChain = this._currentChain();
      if (currentChain) {
        return currentChain.length <= this._model.game?.state.gamePhase;
      } else {
        // Chains have not been initialized yet...
        return false;
      }
    }
  }

  private _currentChain(): TelestrationsMove[] | undefined {
    if (this._model.game && this._chains.length > 0) {
      //have you drawn in this game phase yet?
      const playerNumber = this._model.game?.state.players.findIndex(
        player => player === this._townController.ourPlayer.id,
      );
      const activeChain = this._model.game?.state.activeChains[playerNumber];
      return this._model.game.state.chains.length > activeChain
        ? [...this._model.game.state.chains[activeChain]]
        : undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Returns the chain to which this player should contribute.
   */
  get wordToDraw(): string | undefined {
    const chain = this._currentChain();
    if (chain && chain.length > 0) {
      if (chain[chain.length - 1].word) {
        return chain[chain.length - 1].word;
      } else if (chain.length > 1) {
        return chain[chain.length - 2].word;
      }
    }
    return undefined;
  }

  /**
   * Returns the chain to which this player should contribute.
   */
  get imageToGuess(): Drawing | undefined {
    const chain = this._currentChain();
    if (chain && chain.length > 0) {
      if (chain[chain.length - 1].drawing) {
        return chain[chain.length - 1].drawing;
      } else if (chain.length > 1) {
        return chain[chain.length - 2].drawing;
      }
    }
    return undefined;
  }

  /**
   * At the end of the game, the player should be able to see the progression of their word.
   */
  get ourChain(): TelestrationsMove[] | undefined {
    if (this._model.game && this._chains.length > 0) {
      //have you drawn in this game phase yet?
      const playerNumber = this._model.game?.state.players.findIndex(
        player => player === this._townController.ourPlayer.id,
      );
      // findIndex returns -1 if the player we're looking for isn't found
      return this._model.game.state.chains.length > playerNumber && playerNumber >= 0
        ? [...this._model.game.state.chains[playerNumber]]
        : undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Sends a request to the server to start the game.
   *
   * If the game is not in the WAITING_TO_START state, throws an error.
   *
   * @throws an error with message NO_GAME_STARTABLE if there is no game waiting to start
   */
  public async startGame(): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID) {
      throw new Error('A' + NO_GAME_STARTABLE);
    }
    if (
      !(
        this._model.game?.state.status === 'WAITING_FOR_PLAYERS' ||
        this._model.game?.state.status === 'WAITING_TO_START'
      )
    ) {
      throw new Error(NO_GAME_STARTABLE);
    }

    await this._townController.sendInteractableCommand(this.id, {
      gameID: instanceID,
      type: 'StartGame',
    });
  }
}
