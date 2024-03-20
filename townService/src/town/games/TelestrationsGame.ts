import InvalidParametersError, {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_MOVE_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameMove,
  TelestrationsAction,
  TelestrationsGameState,
  TelestrationsMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';

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
      chains: [],
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

    if (this.state.chains.every(chain => chain.length === this.state.gamePhase + 1)) {
      const activeChains =
        this.state.players.length % 2 === 0 && this.state.gamePhase === 0
          ? this._rotate(this.state.activeChains)
          : this.state.activeChains;
      this.state = {
        ...this.state,
        gamePhase: this.state.gamePhase + 1,
        activeChains,
      };
    }
  }

  private _rotate(arr: readonly number[]): number[] {
    return arr.slice(1).concat(arr[0]);
  }

  protected _join(player: Player): void {
    if (this.state.players.includes(player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      players: this.state.players.concat(player.id),
    };
  }

  protected _leave(player: Player): void {
    if (!this.state.players.includes(player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.status === 'WAITING_TO_START') {
      this.state = {
        ...this.state,
        players: this.state.players.filter(inGame => inGame !== player.id),
        playersReady: this.state.players.filter(inGame => inGame !== player.id),
      };
      this._startGame();
    } else if (this.state.status === 'IN_PROGRESS') {
      this.state = {
        ...this.state,
        status: 'OVER',
      };
    }
  }

  private _canStart(): boolean {
    const playersInGame = this.state.players.length;
    return playersInGame >= 2 && playersInGame === this.state.playersReady.length;
  }

  private _startGame(): void {
    if (this._canStart()) {
      this.state = {
        ...this.state,
        activeChains: new Array<number>(this.state.players.length).map((p, index) => index),
        status: 'IN_PROGRESS',
      };
    }
  }

  public startGame(player: Player): void {
    if (!this.state.players.includes(player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (!this.state.playersReady.includes(player.id)) {
      this.state = {
        ...this.state,
        playersReady: this.state.playersReady.concat(player.id),
      };
    }

    this._startGame();
  }

  private _processMove(move: GameMove<TelestrationsMove>): void {
    this._checkNoPriorMove(move);
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (
      ((this._gamePhase() === 'GUESS' || this._gamePhase() === 'PICK_WORD') && !move.move.word) ||
      (this._gamePhase() === 'DRAW' && !move.move.drawing)
    ) {
      throw new InvalidParametersError(INVALID_MOVE_MESSAGE);
    } else {
      // 1) Lookup the id in this.state.players
      // 2) Update that entry in this.state.chains

      const playerNumber = this._players.findIndex(player => player.id === move.playerID);
      const currentChain = this.state.activeChains[playerNumber];
      const chains = this.state.chains.map((chain, index) => {
        if (index === currentChain) {
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

  private _gamePhase(): TelestrationsAction {
    if (this.state.gamePhase === 0) {
      return 'PICK_WORD';
    }
    if (this.state.gamePhase % 2 !== 0) {
      return 'DRAW';
    }
    return 'PICK_WORD';
  }

  private _checkNoPriorMove(move: GameMove<TelestrationsMove>) {
    const playerNumber = this._players.findIndex(player => player.id === move.playerID);
    if (this.state.chains[playerNumber].length !== this.state.gamePhase) {
      throw new InvalidParametersError('Already made move this round!');
    }
  }
}
