import { ComponentType } from 'react';
import type { GameType } from '../constants/days';
import { QuizGame } from './day01_quiz';
import { StackGame } from './day02_stack';
import { SudokuGame } from './day03_sudoku';
import { SpaceInvadersGame } from './day04_spaceinvaders';
import { SnakeGame } from './day05_snake';
import { DessinConnecteGame } from './day06_dessinconnecte';
import { FruitNinjaGame } from './day07_fruitninja';
import { MemorySequenceGame } from './day08_memory_sequence';
import { BubbleShooterGame } from './day09_bubbleshooter';
import { PipePuzzleGame } from './day10_pipepuzzle';
import { SolitaireGame } from './day11_solitaire';
import { RunnerGame } from './day13_runner';
import { LabyrintheGame } from './day14_labyrinthe';
import { NonogramGame } from './day15_nonogram';
import { WhackAMoleGame } from './day16_whackamole';
import { DodgeBallGame } from './day19_dodgeball';
import { CasseBriquesGame } from './day20_cassebriques';
import { RythmeGame } from './day21_rythme';
import { Day22MarathonGame } from './day22_marathon';
import { Day23MarathonGame } from './day23_marathon';
import { BossGame } from './day24_boss';
import { Game2048 } from './extra_2048';
import { FlappyGame } from './extra_flappy';
import { Match3Game } from './extra_match3';
import { PairsGame } from './extra_pairs';
import { SlidingPuzzleGame } from './extra_slidingpuzzle';
import { WordSearchGame } from './extra_wordsearch';

// Tous les jeux de l'app, par type (pages /game/<jour> et /play/<jeu>)
export const GAME_COMPONENTS: Record<GameType, ComponentType<any>> = {
  quiz: QuizGame,
  sudoku: SudokuGame,
  memory_sequence: MemorySequenceGame,
  snake: SnakeGame,
  stack: StackGame,
  labyrinthe: LabyrintheGame,
  pipepuzzle: PipePuzzleGame,
  spaceinvaders: SpaceInvadersGame,
  whackamole: WhackAMoleGame,
  dessinconnecte: DessinConnecteGame,
  fruitninja: FruitNinjaGame,
  bubbleshooter: BubbleShooterGame,
  solitaire: SolitaireGame,
  nonogram: NonogramGame,
  runner: RunnerGame,
  dodgeball: DodgeBallGame,
  cassebriques: CasseBriquesGame,
  marathon_22: Day22MarathonGame,
  marathon_23: Day23MarathonGame,
  boss: BossGame,
  rythme: RythmeGame,
  game2048: Game2048,
  match3: Match3Game,
  pairs: PairsGame,
  slidingpuzzle: SlidingPuzzleGame,
  wordsearch: WordSearchGame,
  flappy: FlappyGame,
};

// Jeux Phaser (WebView) et marathons : montés dès l'intro pour que la WebView ait le temps de charger.
// Ils attendent INIT pour démarrer et se remettent à zéro eux-mêmes à chaque "Rejouer".
// Les autres (React Native) démarrent leur chrono au montage : montés seulement au clic sur Jouer.
export const PRELOADED_GAMES = new Set<GameType>([
  'stack', 'spaceinvaders', 'fruitninja', 'bubbleshooter', 'whackamole',
  'runner', 'dodgeball', 'cassebriques', 'marathon_22', 'marathon_23', 'boss',
  'flappy',
]);

// Difficulté du jour → difficulté du jeu (le boss joue ses épreuves en "hard")
export const GAME_DIFFICULTY = { easy: 'easy', medium: 'medium', hard: 'hard', very_hard: 'very_hard', boss: 'hard' } as const;
