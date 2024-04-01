import { Drawing, GameArea, GameStatus, TelestrationsAction, TelestrationsGameState, TelestrationsMove } from "../../types/CoveyTownSocket";
import GameAreaController, { GameEventTypes, NO_GAME_IN_PROGRESS_ERROR } from "./GameAreaController";


export type TelestrationsEvents = GameEventTypes & {
    phaseChanged: (phase: number) => void;
    };

/**
 * This class is responsible for managing the state of the Telestrations game, and for sending commands to the server
 * 
 */
export default class TelestrationsAreaController extends GameAreaController<
  TelestrationsGameState,
  TelestrationsEvents> {

    public isActive(): boolean {
        return !this.isEmpty() && this.status && this.status !== 'OVER';
    }
        
    protected _drawing: Drawing | undefined = undefined;

    protected _chains: TelestrationsMove[][] = [[]];

    protected _updateFrom(newModel: GameArea<TelestrationsGameState>): void {
        super._updateFrom(newModel);
        if (newModel.game) {
            this._model.game?.state.chains.forEach((chain, index) => {
                this._chains[index] = [... 
                    chain]
            })
        }
        else {
            this._chains = [[]];
        }
    }

    // Keep an eye out for errors concerning users giving a drawing when not supposed to or vice versea
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
            action: 'GUESS',
            word: input,
            },
        });
        return;
        }
    else {
        await this._townController.sendInteractableCommand(this.id, {
            type: 'GameMove',
            gameID: instanceID,
            move: {
            action: 'DRAW',
            drawing: input,
            },
        });
        return;
        }
    }

    get gamePhase(): TelestrationsAction{
        if (!this._model.game) {
            return "PICK_WORD";
        }
        else if (this._model.game?.state.gamePhase === 0) {
            return "PICK_WORD";
        }
        else if (this._model.game?.state.gamePhase % 2 !== 0) {
            return "DRAW";
        }
        return "GUESS";
    }

    get status(): GameStatus {
        if (!this._model.game) {
            return "WAITING_TO_START";
        }
        else {return this._model.game?.state.status; }}

    /**
     * Returns the current state of the drawing.
     */
    get drawing(): Drawing | undefined {
        return this._drawing;
    }

      /**
   * Returns true if it is our turn to make a move, false otherwise
   */
  get isOurTurn(): boolean {
    if (! this._model.game) {
        return false
    } else {
    //have you drawn in this game phase yet?
    const playerNumber = this._model.game?.state.players.findIndex(player => player === this._townController.ourPlayer.id);
    const currentChain = this._model.game?.state.activeChains[playerNumber];
    //has our town controller player drawn in this phas
    return (this._model.game?.state.chains[currentChain].length <= this._model.game?.state.gamePhase)
  }
    }
  
    

}