import Player from '../../../lib/Player';
import {
  Drawing as DrawingMove,
  DrawingGameState,
  GameInstance,
  GameMove,
} from '../../../types/CoveyTownSocket';
import Game from '../Game';

export default class DrawingGame extends Game<DrawingGameState, DrawingMove> {
  public constructor() {
    super({
      drawings: [],
      status: 'IN_PROGRESS',
    });
  }

  /**
   * Adds another drawing, contained in a GameMove, to the list of drawings.
   * If the length exceeds 10 drawings, removes the earliest drawing, queue-style.
   *
   * @param move a GameMove containing the drawing to add to the list in its `move` field
   */
  public applyMove(move: GameMove<DrawingMove>): void {
    let drawings = this.state.drawings.concat(move.move);
    if (drawings.length > 10) {
      const start = drawings.length - 10;
      drawings = drawings.slice(start, undefined);
    }
    this.state.drawings = drawings;
  }

  protected _join(player: Player): void {
    this.state.status = 'IN_PROGRESS';
  }

  protected _leave(player: Player): void {
    this.state.status = 'OVER';
  }

  public toModel(): GameInstance<DrawingGameState> {
    return {
      state: this.state,
      id: this.id,
      result: this._result,
      players: this._players.map(player => player.id),
    };
  }
}
