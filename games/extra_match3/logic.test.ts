/// <reference types="jest" />
import { Board, collapse, createBoard, findMatches, findValidMove, KINDS, playSwap, resolve, SIZE } from './logic';

// Plateau en damier à 6 friandises : aucun alignement, on y place des motifs précis
function quietBoard(): Board {
  return Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => (r * 2 + c) % KINDS));
}

describe('Match-3 - alignements', () => {
  test('un plateau en damier n’a aucun alignement', () => {
    expect(findMatches(quietBoard())).toHaveLength(0);
  });
  test('trouve un alignement horizontal de 3', () => {
    const board = quietBoard();
    board[0][0] = board[0][1] = board[0][2] = 5;
    board[1][0] = board[1][1] = board[1][2] = 0; // évite d'autres 5 alignés par hasard
    expect(findMatches(board).filter((c) => c.row === 0 && c.col <= 2)).toHaveLength(3);
  });
  test('un L (ligne + colonne) compte chaque case une seule fois', () => {
    const board: Board = Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => (r + c * 2) % KINDS));
    board[3][3] = board[3][4] = board[3][5] = 9;
    board[4][3] = board[5][3] = 9;
    const matches = findMatches(board).filter((c) => board[c.row][c.col] === 9);
    expect(matches).toHaveLength(5);
  });
});

describe('Match-3 - chute et chaînes', () => {
  test('les cases retirées sont comblées par le dessus', () => {
    const board = quietBoard();
    const above = board[2][0];
    const next = collapse(board, [{ row: 3, col: 0 }], () => 0);
    expect(next[3][0]).toBe(above);
    expect(next[0][0]).toBe(0); // nouvelle friandise en haut
  });
  test('resolve ne laisse aucun alignement et compte les points', () => {
    const board = quietBoard();
    board[6][0] = board[6][1] = board[6][2] = 5;
    const result = resolve(board);
    expect(findMatches(result.board)).toHaveLength(0);
    expect(result.gained).toBeGreaterThanOrEqual(30);
    expect(result.chains).toBeGreaterThanOrEqual(1);
  });
});

describe('Match-3 - partie', () => {
  test('un nouveau plateau n’a pas d’alignement et a au moins un coup', () => {
    for (let i = 0; i < 20; i++) {
      const board = createBoard();
      expect(findMatches(board)).toHaveLength(0);
      expect(findValidMove(board)).not.toBeNull();
    }
  });
  test('l’échange proposé par l’indice est accepté', () => {
    const board = createBoard();
    const [a, b] = findValidMove(board)!;
    const result = playSwap(board, a, b);
    expect(result).not.toBeNull();
    expect(result!.gained).toBeGreaterThan(0);
    expect(findValidMove(result!.board)).not.toBeNull();
  });
  test('un échange qui n’aligne rien ou pas voisin est refusé', () => {
    const board = quietBoard();
    expect(playSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBeNull();
    expect(playSwap(board, { row: 0, col: 0 }, { row: 2, col: 0 })).toBeNull();
  });
});
