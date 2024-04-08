export type TownJoinResponse = {
  /** Unique ID that represents this player * */
  userID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  sessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: Player[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Current state of interactables in this town */
  interactables: TypedInteractable[];
}

export type InteractableType = 'ConversationArea' | 'ViewingArea' | 'TicTacToeArea' | 'ConnectFourArea' | 'DrawingArea' | 'TelestrationsArea';
export interface Interactable {
  type: InteractableType;
  id: InteractableID;
  occupants: PlayerID[];
}

export type TownSettingsUpdate = {
  friendlyName?: string;
  isPubliclyListed?: boolean;
}

export type Direction = 'front' | 'back' | 'left' | 'right';

export type PlayerID = string;
export interface Player {
  id: PlayerID;
  userName: string;
  location: PlayerLocation;
};

export type XY = { x: number, y: number };

export interface PlayerLocation {
  /* The CENTER x coordinate of this player's location */
  x: number;
  /* The CENTER y coordinate of this player's location */
  y: number;
  /** @enum {string} */
  rotation: Direction;
  moving: boolean;
  interactableID?: string;
};
export type ChatMessage = {
  author: string;
  sid: string;
  body: string;
  dateCreated: Date;
  interactableID?: string;
};

export interface ConversationArea extends Interactable {
  topic?: string;
};
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface ViewingArea extends Interactable {
  video?: string;
  isPlaying: boolean;
  elapsedTimeSec: number;
}

export type GameStatus = 'IN_PROGRESS' | 'WAITING_TO_START' | 'OVER' | 'WAITING_FOR_PLAYERS';
/**
 * Base type for the state of a game
 */
export interface GameState {
  status: GameStatus;
} 

/**
 * Type for the state of a game that can be won
 */
export interface WinnableGameState extends GameState {
  winner?: PlayerID;
}
/**
 * Base type for a move in a game. Implementers should also extend MoveType
 * @see MoveType
 */
export interface GameMove<MoveType> {
  playerID: PlayerID;
  gameID: GameInstanceID;
  move: MoveType;
}

export type TicTacToeGridPosition = 0 | 1 | 2;

/**
 * Type for a move in TicTacToe
 */
export interface TicTacToeMove {
  gamePiece: 'X' | 'O';
  row: TicTacToeGridPosition;
  col: TicTacToeGridPosition;
}

/**
 * Type for the state of a TicTacToe game
 * The state of the game is represented as a list of moves, and the playerIDs of the players (x and o)
 * The first player to join the game is x, the second is o
 */
export interface TicTacToeGameState extends WinnableGameState {
  moves: ReadonlyArray<TicTacToeMove>;
  x?: PlayerID;
  o?: PlayerID;
}

/**
 * Type for the state of a ConnectFour game.
 * The state of the game is represented as a list of moves, and the playerIDs of the players (red and yellow)
 */
export interface ConnectFourGameState extends WinnableGameState {
  // The moves in this game
  moves: ReadonlyArray<ConnectFourMove>;
  // The playerID of the red player, if any
  red?: PlayerID;
  // The playerID of the yellow player, if any
  yellow?: PlayerID;
  // Whether the red player is ready to start the game
  redReady?: boolean;
  // Whether the yellow player is ready to start the game
  yellowReady?: boolean;
  // The color of the player who will make the first move
  firstPlayer: ConnectFourColor;
}

/**
 * Type for a move in ConnectFour
 * Columns are numbered 0-6, with 0 being the leftmost column
 * Rows are numbered 0-5, with 0 being the top row
 */
export interface ConnectFourMove {
  gamePiece: ConnectFourColor;
  col: ConnectFourColIndex;
  row: ConnectFourRowIndex;
}

/**
 * Row indices in ConnectFour start at the top of the board and go down
 */
export type ConnectFourRowIndex = 0 | 1 | 2 | 3 | 4 | 5;
/**
 * Column indices in ConnectFour start at the left of the board and go right
 */
export type ConnectFourColIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ConnectFourColor = 'Red' | 'Yellow';

export type InteractableID = string;
export type GameInstanceID = string;

export interface DrawingGameState extends GameState {
  drawings: ReadonlyArray<Drawing>;
}

/**
 * Type for the result of a game
 */
export interface GameResult {
  gameID: GameInstanceID;
  scores: { [playerName: string]: number };
}

/**
 * Base type for an *instance* of a game. An instance of a game
 * consists of the present state of the game (which can change over time),
 * the players in the game, and the result of the game
 * @see GameState
 */
export interface GameInstance<T extends GameState> {
  state: T;
  id: GameInstanceID;
  players: PlayerID[];
  result?: GameResult;
}

/**
 * Base type for an area that can host a game
 * @see GameInstance
 */
export interface GameArea<T extends GameState> extends Interactable {
  game: GameInstance<T> | undefined;
  history: GameResult[];
}

export type CommandID = string;

/**
 * Base type for a command that can be sent to an interactable.
 * This type is used only by the client/server interface, which decorates
 * an @see InteractableCommand with a commandID and interactableID
 */
interface InteractableCommandBase {
  /**
   * A unique ID for this command. This ID is used to match a command against a response
   */
  commandID: CommandID;
  /**
   * The ID of the interactable that this command is being sent to
   */
  interactableID: InteractableID;
  /**
   * The type of this command
   */
  type: string;
}

export type InteractableCommand =  ViewingAreaUpdateCommand | JoinGameCommand | GameMoveCommand<TicTacToeMove> | GameMoveCommand<ConnectFourMove> | GameMoveCommand<TelestrationsMove> | StartGameCommand | LeaveGameCommand | SaveDrawingCommand;
export interface ViewingAreaUpdateCommand  {
  type: 'ViewingAreaUpdate';
  update: ViewingArea;
}
export interface JoinGameCommand {
  type: 'JoinGame';
}
export interface LeaveGameCommand {
  type: 'LeaveGame';
  gameID: GameInstanceID;
}
export interface StartGameCommand {
  type: 'StartGame';
  gameID: GameInstanceID;
}

export interface SaveDrawingCommand {
  type: 'SaveDrawing';
  drawing: Drawing;
}

export interface GameMoveCommand<MoveType> {
  type: 'GameMove';
  gameID: GameInstanceID;
  move: MoveType;
}
export type InteractableCommandReturnType<CommandType extends InteractableCommand> = 
  CommandType extends JoinGameCommand ? { gameID: string}:
  CommandType extends ViewingAreaUpdateCommand ? undefined :
  CommandType extends GameMoveCommand<TicTacToeMove> ? undefined :
  CommandType extends LeaveGameCommand ? undefined :
  never;

export type InteractableCommandResponse<MessageType> = {
  commandID: CommandID;
  interactableID: InteractableID;
  error?: string;
  payload?: InteractableCommandResponseMap[MessageType];
}

export interface ServerToClientEvents {
  playerMoved: (movedPlayer: Player) => void;
  playerDisconnect: (disconnectedPlayer: Player) => void;
  playerJoined: (newPlayer: Player) => void;
  initialize: (initialData: TownJoinResponse) => void;
  townSettingsUpdated: (update: TownSettingsUpdate) => void;
  townClosing: () => void;
  chatMessage: (message: ChatMessage) => void;
  interactableUpdate: (interactable: Interactable) => void;
  commandResponse: (response: InteractableCommandResponse) => void;
}

export interface ClientToServerEvents {
  chatMessage: (message: ChatMessage) => void;
  playerMovement: (movementData: PlayerLocation) => void;
  interactableUpdate: (update: Interactable) => void;
  interactableCommand: (command: InteractableCommand & InteractableCommandBase) => void;
}

export type Drawing = {
  drawingID: string,
  authorID: string,
  /**
   *  Even though the `userDrawing` string encodes the dimension,
   *  It is useful to supply them here.
   * 
   *  The drawing library will scale images to fit new dimensions, but we may not wish to allow that.
   */    
  length?: number,
  width?: number,

  metadata?: {
      // Support arbitrary metadata, since we probably won't need to use it very often.
      // Could be nice to track timestamps ("Drawing created on..."), etc.
      [field: string]: string | number
  },

  /**
   *  This is a JSON string produced by the drawing library.
   *  It contains a the canvas dimensions, as well as every single point drawn on the canvas.
   *  This field can understandably become very large.
   * 
   *  The library author suggests using a compression 
   *  algorithm such as @link https://github.com/pieroxy/lz-string
   *  in order to keep sizes small.
   * 
   *  The important part is that ALL Drawings are compressed.
   *  It will cause issues if we have different procedures across the project.
   * 
   */
  userDrawing: string,
}

export interface TelestrationsGameState extends GameState {
  // The players in gameplay order.
  players: ReadonlyArray<PlayerID>,
  // The drawings and guesses in this game.
  // `chains[n]` is an alternating array of words and drawings
  // starting with the word picked by the `n`th player.
  chains: ReadonlyArray<ReadonlyArray<TelestrationsMove>>,
  // Whether each player is ready to start the game
  playersReady: ReadonlyArray<PlayerID>,
  // the number of phases of the game so far.
  gamePhase: number,
  // `activeChains[n] = i` means that player `n` should is currently
  // contributing to `chains[i]`.
  activeChains: ReadonlyArray<number>,
  // Should we have a set number of players needed to start?
  // Should only one player get to start the game?
  // TODO
}

/**
 * Type for a move in Telestrations
 * Specifies the type of the action.
 * If `action` is 'PICK_WORD', then `word` is the word.
 * If `action` is 'GUESS', then `word` is the guess.
 * If `action` is 'DRAW', `word` is ignored and `drawing` is populated.
 * Otherwise, `drawing` is ignored.
 */
export type TelestrationsMove = {
  gamePiece: "STUB",
  action: TelestrationsAction,
  word?: string,
  drawing?: Drawing,
}

export type TelestrationsAction = 'PICK_WORD' | 'DRAW' | 'GUESS';

