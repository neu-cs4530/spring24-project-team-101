import { nanoid } from 'nanoid';
import { createPlayerForTesting } from '../../TestUtils';
import DrawingGame from './DrawingGame';

const makeDrawing = (str: string) => ({
  drawingID: nanoid(),
  authorID: nanoid(),
  userDrawing: str,
});

describe('DrawingGame', () => {
  let drawingGame: DrawingGame;

  beforeEach(() => {
    drawingGame = new DrawingGame();
  });

  test('drawings are initially empty and status is initially IN_PROGRESS', () => {
    expect(drawingGame.state.drawings).toHaveLength(0);
    expect(drawingGame.state.status).toEqual('IN_PROGRESS');
  });

  test('applyMove adds a drawing to the list', () => {
    expect(drawingGame.state.drawings).toHaveLength(0);
    drawingGame.applyMove({
      move: makeDrawing('fake drawing'),
      playerID: 'id',
      gameID: 'id',
    });
    expect(drawingGame.state.drawings).toHaveLength(1);
    expect(drawingGame.state.drawings.map(drawing => drawing.userDrawing)).toContain(
      'fake drawing',
    );
  });
  test('applyMove adds multiple drawings to the list (less than 10)', () => {
    expect(drawingGame.state.drawings).toHaveLength(0);
    drawingGame.applyMove({
      move: makeDrawing('fake drawing'),
      playerID: 'id',
      gameID: 'id',
    });
    drawingGame.applyMove({
      move: makeDrawing('fake drawing'),
      playerID: 'id',
      gameID: 'id',
    });
    expect(drawingGame.state.drawings).toHaveLength(2);
    expect(drawingGame.state.drawings.map(drawing => drawing.userDrawing)).toContain(
      'fake drawing',
    );
  });

  test('applyMove rotates the list once it reaches length 10', () => {
    drawingGame.state.drawings = [
      'drawing1',
      'drawing2',
      'drawing3',
      'drawing4',
      'drawing5',
      'drawing6',
      'drawing7',
      'drawing8',
      'drawing9',
      'drawing10',
    ].map(str => makeDrawing(str));
    expect(drawingGame.state.drawings).toHaveLength(10);
    drawingGame.applyMove({
      move: makeDrawing('new drawing'),
      playerID: 'id',
      gameID: 'id',
    });
    expect(drawingGame.state.drawings).toHaveLength(10);
    expect(drawingGame.state.drawings.map(drawing => drawing.userDrawing)).toContain('new drawing');
    expect(drawingGame.state.drawings.map(drawing => drawing.userDrawing)).not.toContain(
      'drawing1',
    );
  });

  test('_join sets status to IN_PROGRESS', () => {
    drawingGame.state.status = 'OVER';
    drawingGame.join(createPlayerForTesting());
    expect(drawingGame.state.status).toEqual('IN_PROGRESS');
  });

  test('_leave sets status to OVER', () => {
    const testPlayer = createPlayerForTesting();
    drawingGame.join(testPlayer);
    expect(drawingGame.state.status).toEqual('IN_PROGRESS');
    drawingGame.leave(testPlayer);
    expect(drawingGame.state.status).toEqual('OVER');
  });

  test('toModel contains the expected information', () => {
    const model = drawingGame.toModel();
    expect(model.id).toEqual(drawingGame.id);
    expect(model.players).toHaveLength(0);
    expect(model.result).toBeUndefined();
    expect(model.state).toEqual(drawingGame.state);
  });

  test('toModel works with multiple players', () => {
    const testPlayer1 = createPlayerForTesting();
    drawingGame.join(testPlayer1);
    const testPlayer2 = createPlayerForTesting();
    drawingGame.join(testPlayer2);
    const model = drawingGame.toModel();
    expect(model.id).toEqual(drawingGame.id);
    expect(model.players).toHaveLength(2);
    expect(model.result).toBeUndefined();
    expect(model.state).toEqual(drawingGame.state);
  });
});
