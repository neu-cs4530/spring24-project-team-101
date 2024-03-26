import InvalidParametersError, {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_MOVE_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameMove,
  PlayerID,
  TelestrationsAction,
  TelestrationsGameState,
  TelestrationsMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';

const MINIMUM_PLAYERS = 2;

export default class TelestrationsGame extends Game<TelestrationsGameState, TelestrationsMove> {
  /**
   * Constructor for a new Telestrations game.
   * Initializes an empty game waiting for players.
   */
  public constructor() {
    super({
      status: 'WAITING_FOR_PLAYERS',
      players: [],
      playersReady: [],
      activeChains: [],
      chains: [[]],
      gamePhase: 0,
    });
  }

  /** Applies a move to the game.
   * Uses the internal game state to determine if the current phase is
   *
   * Validates the move, and if it is valid, applies it to the game state.
   *
   * If the move ends the game, updates the game state to reflect the end of the game,
   * setting the status to "OVER" and the winner to the player who won (or "undefined" if it was a tie)
   *
   * @param move The move to attempt to apply
   *
   * @throws InvalidParametersError if the game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the move does not have the correct field: `drawing` or `word` (INVALID_MOVE_MESSAGE)
   */
  public applyMove(move: GameMove<TelestrationsMove>): void {
    this._processMove(move);

    // If every player has made a move:
    if (this.state.chains.every(chain => chain.length === this.state.gamePhase + 1)) {
      const activeChains =
        // Don't rotate on the first round for even players, otherwise we always rotate.
        this.state.players.length % 2 === 0 && this.state.gamePhase === 0
          ? this.state.activeChains
          : this._rotate(this.state.activeChains);

      // If every player has contributed to every row, the game should end.
      // In other words, we end when `chains` is a square matrix.
      if (this.state.chains.every(chain => chain.length === this.state.chains.length)) {
        this.state = {
          ...this.state,
          status: 'OVER',
        };
      } else {
        // Continue to the next phase.
        this.state = {
          ...this.state,
          gamePhase: this.state.gamePhase + 1,
          activeChains,
        };
      }
    }
  }

  private _processMove(move: GameMove<TelestrationsMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    this._checkNoPriorMove(move);

    if (
      // If it's a guess or a pick_word, the move must have a word.
      // If it's a draw round, the move must have a drawing.
      ((this._gamePhase() === 'GUESS' || this._gamePhase() === 'PICK_WORD') && !move.move.word) ||
      (this._gamePhase() === 'DRAW' && !move.move.drawing)
    ) {
      throw new InvalidParametersError(INVALID_MOVE_MESSAGE);
    } else {
      // 1) Lookup the id in this.state.players
      // 2) Update that entry in this.state.chains

      const chains = this.state.chains.map((chain, index) => {
        if (index === this._currentChain(move.playerID)) {
          return chain.concat(move.move);
        }
        return chain;
      });

      this.state = {
        ...this.state,
        chains,
      };
    }
  }

  private _rotate(arr: readonly number[]): number[] {
    return arr.slice(1).concat(arr[0]);
  }

  protected _join(player: Player): void {
    if (this._inGame(player)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      players: this.state.players.concat(player.id),
    };
    if (
      this.state.status === 'WAITING_FOR_PLAYERS' &&
      this.state.players.length >= MINIMUM_PLAYERS
    ) {
      this.state = {
        ...this.state,
        status: 'WAITING_TO_START',
      };
    }
  }

  protected _leave(player: Player): void {
    if (!this._inGame(player)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.status === 'WAITING_TO_START') {
      this._removePlayer(player);
      this._startGame();
    } else if (this.state.status === 'IN_PROGRESS') {
      this.state = {
        ...this.state,
        status: 'OVER',
      };
    }
  }

  public startGame(player: Player): void {
    if (!this._inGame(player)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    // Set the player to `ready`
    if (!this.state.playersReady.includes(player.id)) {
      this.state = {
        ...this.state,
        playersReady: this.state.playersReady.concat(player.id),
      };
    }

    this._startGame();
  }

  private _canStart(): boolean {
    const playersInGame = this.state.players.length;
    return playersInGame >= 2 && playersInGame === this.state.playersReady.length;
  }

  private _startGame(): void {
    if (this._canStart()) {
      this.state = {
        ...this.state,
        // One empty list for each player
        chains: this.state.players.map(p => []),
        // For the first turn (picking a word), `activeChains[n]` === `n`
        // Note that filling the area first is necessary!
        // ¯\_(ツ)_/¯
        // this took me 2 hours to find.
        activeChains: new Array<number>(this.state.players.length).fill(0).map((p, index) => index),
        status: 'IN_PROGRESS',
      };
    }
  }

  private _gamePhase(): TelestrationsAction {
    if (this.state.gamePhase === 0) {
      return 'PICK_WORD';
    }
    if (this.state.gamePhase % 2 !== 0) {
      return 'DRAW';
    }
    return 'GUESS';
  }

  private _checkNoPriorMove(move: GameMove<TelestrationsMove>) {
    if (this.state.chains[this._currentChain(move.playerID)].length > this.state.gamePhase) {
      throw new InvalidParametersError('Already made move this round!');
    }
  }

  private _currentChain(playerID: PlayerID): number {
    const playerNumber = this.state.players.findIndex(player => player === playerID);
    return this.state.activeChains[playerNumber];
  }

  /**
   * Is the given player in the current game?
   * @param player the player
   */
  private _inGame(player: Player): boolean {
    return this.state.players.includes(player.id);
  }

  /**
   * Removes a given player from the game state.
   * @param player the player
   */
  private _removePlayer(player: Player): void {
    this.state = {
      ...this.state,
      players: this.state.players.filter(playerInGame => playerInGame !== player.id),
      playersReady: this.state.playersReady.filter(playerInGame => playerInGame !== player.id),
    };
  }
}
