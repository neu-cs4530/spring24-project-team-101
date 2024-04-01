import Player from '../../lib/Player';
import {
  Drawing as DrawingMove,
  DrawingGameState,
  GameInstance,
  GameMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';

export default class DrawingGame extends Game<DrawingGameState, DrawingMove> {
  public constructor() {
    super({
      drawings: [],
      status: 'IN_PROGRESS',
    });
  }

  public applyMove(move: GameMove<DrawingMove>): void {
    // TODO: (optional) restrict the list to e.g. 10 images, removing the oldest images queue style
    this.state.drawings.concat(move.move);
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
