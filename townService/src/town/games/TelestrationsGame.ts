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

/**
 * A class to represent a game of Telestrations{TM}.
 * @see https://en.wikipedia.org/wiki/Telestrations
 */
export default class TelestrationsGame extends Game<TelestrationsGameState, TelestrationsMove> {
  /**
   * Constructor for a new Telestrations game.
   * Initializes an empty game waiting for players.
   *
   * For now, no options. Perhaps MINIMUM_PLAYERS should be supplied here?
   */
  public constructor(players?: PlayerID[]) {
    super({
      status: 'WAITING_FOR_PLAYERS',
      players: [],
      playersReady: [],
      activeChains: [], // initialized at `startGame`
      chains: [[]], // initialized at `startGame
      gamePhase: 0,
    });
  }

  /**
   * Registers a player for the game.
   * Places them at the end of list of players.
   * i.e. they will follow the previously-joined player.
   *
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the game is full (GAME_FULL_MESSAGE)
   *
   * @param player the player
   */
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

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   *
   * If the game state is currently "IN_PROGRESS", updates the game's status to OVER.
   * If the game state is currently "WAITING_TO_START", updates the game's status to WAITING_FOR_PLAYERS.
   * If the game state is currently "WAITING_FOR_PLAYERS" or "OVER", the game state is unchanged.
   *
   * Note that this function can start the game!
   * If all players but one are ready, and that player leaves, the game will start.
   *
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   *
   * @param player The player to remove from the game
   */
  protected _leave(player: Player): void {
    if (!this._inGame(player)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    const playerIndex = this.state.players.indexOf(player.id);
    if (this.state.status === 'WAITING_TO_START' || this.state.status === 'WAITING_FOR_PLAYERS') {
      this._removePlayer(player);
      if (this.state.players.length < MINIMUM_PLAYERS) {
        this.state = {
          ...this.state,
          status: 'WAITING_FOR_PLAYERS',
        };
      }
      // Remove player's chains and moves
      this.state.chains.slice(playerIndex, 1);
      this.state.activeChains.slice(playerIndex, 1);
      this._startGame();
    } else if (this.state.status === 'IN_PROGRESS') {
      this.state = {
        ...this.state,
        status: 'OVER',
      };
    }
  }

  /**
   * Indicates that a player is ready to start the game.
   * Updates the game state to indicate that the player is ready to start the game.
   *
   * If all players are ready, and there are more than `MINIMUM_PLAYERS`, the game will start.
   *
   * The first phase is always PICK_WORD.
   * - If there are an even number of players, they all draw their own word.
   * - If there are an odd number of players, they all draw another player's word.
   *
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   *
   * @param player The player who is ready to start the game
   */
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
      const evenPlayers = this.state.players.length % 2 === 0;

      const activeChains =
        // Don't rotate on the first round for even players, otherwise we always rotate.
        evenPlayers && this.state.gamePhase === 0
          ? this.state.activeChains
          : this._rotate(this.state.activeChains);

      // If every player has contributed to every row, the game should end.
      // In other words, we end when `chains` is a square matrix with an odd number of players.
      // With even players, players draw their own word, so each chain should be one longer.
      if (
        (evenPlayers &&
          this.state.chains.every(chain => chain.length === this.state.chains.length + 1)) ||
        (!evenPlayers &&
          this.state.chains.every(chain => chain.length === this.state.chains.length))
      ) {
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

  /**
   * Helper for `applyMove`.
   * 1) Checks if the move is valid
   * 2) Appends the move to the current player's chain
   * 3) Updates state.
   */
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
    }

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

  /**
   * "Rotates" the contents of the given array by
   * moving the first element to the end.
   *
   * e.g. [A, B, C, D] ==> [B, C, D, A] ==> [C, D, A, B] ==> ...
   */
  private _rotate(arr: readonly number[]): number[] {
    return arr.slice(1).concat(arr[0]);
  }

  /**
   * Helper for `_startGame`.
   * @returns truthy if there are enough players, and they are all ready.
   */
  private _canStart(): boolean {
    const playersInGame = this.state.players.length;
    return playersInGame >= MINIMUM_PLAYERS && playersInGame === this.state.playersReady.length;
  }

  /**
   * Handles the logic for starting a game, by initializing the game state.
   */
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

  /**
   * Converts from the _number_ of game phases to the _type_ of game phase.
   * @returns the current game phase
   */
  private _gamePhase(): TelestrationsAction {
    if (this.state.gamePhase === 0) {
      return 'PICK_WORD';
    }
    if (this.state.gamePhase % 2 !== 0) {
      return 'DRAW';
    }
    return 'GUESS';
  }

  /**
   * Helper for `_processMove`.
   * Determines if a move's author has already contributed this round.
   * @param move the move to check validity
   */
  private _checkNoPriorMove(move: GameMove<TelestrationsMove>) {
    if (this.state.chains[this._currentChain(move.playerID)].length > this.state.gamePhase) {
      throw new InvalidParametersError('Already made move this round!');
    }
  }

  /**
   * Retrieves the index of the chain to which the player should contribute this round.
   * @param playerID the player's ID
   * @returns the index of the player's active chain
   */
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
