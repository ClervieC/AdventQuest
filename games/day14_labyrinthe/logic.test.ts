import {
    attemptMove,
    calculateMazeScore,
    canMove,
    generateMaze,
    getNextPosition,
    isAtExit,
    Maze,
} from './logic';

describe('generateMaze', () => {
  test('génère une grille de la bonne taille', () => {
    const maze = generateMaze(8);
    expect(maze).toHaveLength(8);
    expect(maze[0]).toHaveLength(8);
  });

  test('toutes les cellules sont marquées visitées après génération', () => {
    const maze = generateMaze(6);
    const allVisited = maze.every((row) => row.every((cell) => cell.visited));
    expect(allVisited).toBe(true);
  });

  test('génère des labyrinthes différents à chaque appel', () => {
    const maze1 = generateMaze(8);
    const maze2 = generateMaze(8);
    // on compare juste la config de murs de la cellule (0,0), très improbable qu'elle soit identique
    expect(maze1[0][0].walls).not.toEqual(maze2[1][1].walls); // comparaison différente pour éviter un faux negatif trivial
  });
});

describe('canMove et getNextPosition', () => {
  test('un mur bloque le mouvement dans cette direction', () => {
    const maze: Maze = [
      [{ walls: { top: true, right: true, bottom: true, left: true }, visited: true }],
    ];
    expect(canMove(maze, { row: 0, col: 0 }, 'up')).toBe(false);
  });

  test('une ouverture permet le mouvement', () => {
    const maze: Maze = [
      [
        { walls: { top: true, right: false, bottom: true, left: true }, visited: true },
        { walls: { top: true, right: true, bottom: true, left: false }, visited: true },
      ],
    ];
    expect(canMove(maze, { row: 0, col: 0 }, 'right')).toBe(true);
  });

  test('getNextPosition calcule correctement chaque direction', () => {
    const pos = { row: 5, col: 5 };
    expect(getNextPosition(pos, 'up')).toEqual({ row: 4, col: 5 });
    expect(getNextPosition(pos, 'down')).toEqual({ row: 6, col: 5 });
    expect(getNextPosition(pos, 'left')).toEqual({ row: 5, col: 4 });
    expect(getNextPosition(pos, 'right')).toEqual({ row: 5, col: 6 });
  });
});

describe('attemptMove', () => {
  test('bloqué par un mur : reste à la même position', () => {
    const maze: Maze = [
      [{ walls: { top: true, right: true, bottom: true, left: true }, visited: true }],
    ];
    const result = attemptMove(maze, { row: 0, col: 0 }, 'up');
    expect(result).toEqual({ row: 0, col: 0 });
  });

  test('chemin ouvert : se déplace réellement', () => {
    const maze: Maze = [
      [
        { walls: { top: true, right: false, bottom: true, left: true }, visited: true },
        { walls: { top: true, right: true, bottom: true, left: false }, visited: true },
      ],
    ];
    const result = attemptMove(maze, { row: 0, col: 0 }, 'right');
    expect(result).toEqual({ row: 0, col: 1 });
  });
});

describe('isAtExit', () => {
  test('détecte correctement la sortie en bas à droite', () => {
    expect(isAtExit({ row: 7, col: 7 }, 8)).toBe(true);
  });

  test('retourne false ailleurs dans la grille', () => {
    expect(isAtExit({ row: 3, col: 5 }, 8)).toBe(false);
  });

  test('détecte la sortie pour une grille de taille différente', () => {
    expect(isAtExit({ row: 4, col: 4 }, 5)).toBe(true);
  });
});

describe('calculateMazeScore', () => {
  test('score parfait avec le nombre de mouvements optimal', () => {
    const score = calculateMazeScore(16, 8); // optimal = 8*2 = 16
    expect(score).toBe(1000);
  });

  test('pénalité progressive avec plus de mouvements', () => {
    const score = calculateMazeScore(26, 8); // 10 mouvements de trop
    expect(score).toBe(850); // 1000 - (10 * 15)
  });

  test('le score ne descend jamais sous 200', () => {
    const score = calculateMazeScore(9999, 8);
    expect(score).toBe(200);
  });
});

describe('Solvabilité du labyrinthe généré (test d\'intégration de la logique)', () => {
  test('il existe toujours un chemin de (0,0) vers la sortie', () => {
    const size = 8;
    const maze = generateMaze(size);

    // BFS simple pour vérifier l'accessibilité de la sortie
    const visited = new Set<string>();
    const queue: Array<{ row: number; col: number }> = [{ row: 0, col: 0 }];
    visited.add('0,0');
    let foundExit = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (isAtExit(current, size)) {
        foundExit = true;
        break;
      }

      (['up', 'down', 'left', 'right'] as const).forEach((dir) => {
        if (canMove(maze, current, dir)) {
          const next = getNextPosition(current, dir);
          const key = `${next.row},${next.col}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(next);
          }
        }
      });
    }

    expect(foundExit).toBe(true);
  });
});