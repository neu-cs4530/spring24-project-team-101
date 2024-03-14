import Player from '../../lib/Player';
import {
  GameInstance,
  GameInstanceID,
  GameMove,
  GameResult,
  GameState,
  TelestrationsDrawingMove,
  TelestrationsGameState,
  TelestrationsGuessMove,
  TelestrationsMove,
  TelestrationsInteractableCommand,
} from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * This class is to represent a Telestrations game.
 */
export default class TelestrationsGame extends Game<TelestrationsGameState, TelestrationsMove> {  

    public constructor(initialState: TelestrationsGameState) {
        super(initialState);
    }