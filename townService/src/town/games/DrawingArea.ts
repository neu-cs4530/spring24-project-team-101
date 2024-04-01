import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
} from '../../types/CoveyTownSocket';
import DrawingGame from './DrawingGame';
import GameArea from './GameArea';

export default class DrawingArea extends GameArea<DrawingGame> {
  protected getType(): InteractableType {
    return 'DrawingArea';
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'SaveDrawing') {
      const { drawing } = command;
      if (!drawing) {
        throw new InvalidParametersError('No drawing to save');
      }
      if (command.gameID !== this.game?.id) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      this.game?.applyMove({
        playerID: player.id,
        gameID: this.game?.id,
        move: command.drawing,
      });
      this._emitAreaChanged();
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'ToggleMode') {
      if (command.gameID !== this.game?.id) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      this.game.toggleMode();
      this._emitAreaChanged();
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'JoinGame') {
      let game = this._game;
      if (!game) {
        game = new DrawingGame();
        this._game = game;
      }
      this.game?.join(player);
      this._emitAreaChanged();
      return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'LeaveGame') {
      if (command.gameID !== this.game?.id) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      this.game.leave(player);
      this._emitAreaChanged();
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }

  /** The drawing area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
  }
}
