/// <reference types="jest" />
import { addRandomTile, bestMove, emptyBoard, isStuck, maxTile, move, newGame, slideRow } from './logic';

describe('2048 - glissement d’une ligne', () => {
  test('les tuiles se tassent à gauche', () => {
    expect(slideRow([0, 2, 0, 4]).row).toEqual([2, 4, 0, 0]);
  });
  test('deux tuiles identiques fusionnent et rapportent leur somme', () => {
    expect(slideRow([2, 2, 0, 0])).toEqual({ row: [4, 0, 0, 0], gained: 4 });
  });
  test('une tuile ne fusionne qu’une fois par coup', () => {
    expect(slideRow([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], gained: 8 });
    expect(slideRow([4, 4, 8, 0]).row).toEqual([8, 8, 0, 0]);
  });
});

describe('2048 - coups', () => {
  const board = [
    [2, 0, 0, 2],
    [0, 4, 0, 4],
    [0, 0, 0, 0],
    [8, 0, 0, 0],
  ];
  test('vers la droite', () => {
    expect(move(board, 'right').board[0]).toEqual([0, 0, 0, 4]);
    expect(move(board, 'right').board[1]).toEqual([0, 0, 0, 8]);
  });
  test('vers le haut', () => {
    const result = move(board, 'up').board;
    expect(result.map((row) => row[0])).toEqual([2, 8, 0, 0]);
  });
  test('un coup qui ne change rien n’est pas un coup', () => {
    const packed = [
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(packed, 'left').moved).toBe(false);
    expect(move(packed, 'right').moved).toBe(true);
  });
});

describe('2048 - partie', () => {
  test('une nouvelle partie commence avec 2 tuiles', () => {
    expect(newGame().flat().filter((v) => v > 0)).toHaveLength(2);
  });
  test('addRandomTile ne touche pas un plateau plein', () => {
    const full = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(addRandomTile(full)).toBe(full);
    expect(isStuck(full)).toBe(true);
    expect(bestMove(full)).toBeNull();
  });
  test('l’indice choisit un coup qui fusionne', () => {
    const board = emptyBoard();
    board[0][0] = 64;
    board[0][1] = 64;
    expect(['left', 'right']).toContain(bestMove(board));
    expect(maxTile(board)).toBe(64);
  });
});
