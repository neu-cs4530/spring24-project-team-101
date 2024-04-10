import Player from '../../../lib/Player';
import {
  Drawing as DrawingMove,
  DrawingGameState,
  GameInstance,
  GameMove,
} from '../../../types/CoveyTownSocket';
import Game from '../Game';

/**
 * DrawingGame is a Game that allows players to draw on a shared canvas.
 */
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

  /**
   * When a player joins the game, the game is set to 'IN_PROGRESS'.
   * @param player the player who joined
   */
  protected _join(player: Player): void {
    this.state.status = 'IN_PROGRESS';
  }

  /**
   * When a player leaves the game, the game is set to 'OVER'.
   * @param player the player who left
   */
  protected _leave(player: Player): void {
    this.state.status = 'OVER';
  }

  /**
   * Converts the DrawingGame to a GameInstance.
   * @returns the GameInstance representation of this DrawingGame
   */
  public toModel(): GameInstance<DrawingGameState> {
    return {
      state: this.state,
      id: this.id,
      result: this._result,
      players: this._players.map(player => player.id),
    };
  }
}
