import InvalidParametersError, {
  INVALID_COMMAND_MESSAGE,
} from '../../../lib/InvalidParametersError';
import Player from '../../../lib/Player';
import {
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
} from '../../../types/CoveyTownSocket';
import DrawingGame from './DrawingGame';
import GameArea from '../GameArea';

/**
 * DrawingArea is a GameArea that allows players to draw on a shared canvas.
 */
export default class DrawingArea extends GameArea<DrawingGame> {
  protected getType(): InteractableType {
    return 'DrawingArea';
  }

  /** we don't support a joinGame command, so the game is initialized here instead */
  public get game(): DrawingGame {
    if (!this._game) {
      this._game = new DrawingGame();
    }
    return this._game;
  }

  /**
   * handleCommand is called when a player sends a command to the DrawingArea
   * @param command the command to handle
   * @param player the player who sent the command
   * @returns the result of the command
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'SaveDrawing') {
      this.game.applyMove({
        playerID: player.id,
        gameID: this.game?.id,
        move: command.drawing,
      });
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
