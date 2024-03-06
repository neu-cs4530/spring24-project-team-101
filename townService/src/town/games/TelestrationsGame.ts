import Player from '../../lib/Player';
import { GameMove, TelestrationsGameState, TelestrationsMove } from '../../types/CoveyTownSocket';
import Game from './Game';

export default class TelestrationsGame extends Game<TelestrationsGameState, TelestrationsMove> {
  public applyMove(move: GameMove<TelestrationsMove>): void {
    throw new Error('Method not implemented.');
  }

  protected _join(player: Player): void {
    throw new Error('Method not implemented.');
  }

  protected _leave(player: Player): void {
    throw new Error('Method not implemented.');
  }

  public startGame(player: Player): void {
    throw new Error('Method not implemented');
  }
}
