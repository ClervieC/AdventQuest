import { ImageSourcePropType } from 'react-native';
import type { Localized } from '../services/i18n';
import { GameType } from './days';
import type { ExtraGameType } from './extraGames';

// Tutoriels affichés avant de jouer : une capture du jeu en cours de partie + les règles en 3 étapes.
// Les captures (assets/tutorials) sont prises dans le navigateur, jeu lancé, en 393×796 : tuto-<jeu>.jpg en
// français, tuto-<jeu>.en.jpg en anglais (le tutoriel montre celle de la langue du joueur).

export interface TutorialStep {
  icon: string;
  text: Localized;
}

// Une épreuve d'un marathon : sa capture à côté de ses propres règles (comme un jeu simple)
// Capture du jeu dans chaque langue (textes du jeu en français ou en anglais)
export interface ShotSource {
  fr: ImageSourcePropType;
  en: ImageSourcePropType;
}

export interface TutorialSection {
  title: Localized;
  image: ShotSource;
  steps: TutorialStep[];
}

export interface GameTutorial {
  images: { source: ShotSource; caption?: Localized }[];
  sections?: TutorialSection[]; // marathons : une section par épreuve, dans l'ordre
  steps: TutorialStep[]; // marathons : règles communes, affichées après les épreuves
  keyboard?: Localized; // commandes au clavier, affichées seulement sur ordi
}

const IMAGES: Record<string, ShotSource> = {
  quiz: { fr: require('../assets/tutorials/tuto-quiz.jpg'), en: require('../assets/tutorials/tuto-quiz.en.jpg') },
  stack: { fr: require('../assets/tutorials/tuto-stack.jpg'), en: require('../assets/tutorials/tuto-stack.en.jpg') },
  sudoku: { fr: require('../assets/tutorials/tuto-sudoku.jpg'), en: require('../assets/tutorials/tuto-sudoku.en.jpg') },
  spaceinvaders: { fr: require('../assets/tutorials/tuto-spaceinvaders.jpg'), en: require('../assets/tutorials/tuto-spaceinvaders.en.jpg') },
  snake: { fr: require('../assets/tutorials/tuto-snake.jpg'), en: require('../assets/tutorials/tuto-snake.en.jpg') },
  dessinconnecte: { fr: require('../assets/tutorials/tuto-dessinconnecte.jpg'), en: require('../assets/tutorials/tuto-dessinconnecte.en.jpg') },
  fruitninja: { fr: require('../assets/tutorials/tuto-fruitninja.jpg'), en: require('../assets/tutorials/tuto-fruitninja.en.jpg') },
  memory_sequence: { fr: require('../assets/tutorials/tuto-memory_sequence.jpg'), en: require('../assets/tutorials/tuto-memory_sequence.en.jpg') },
  bubbleshooter: { fr: require('../assets/tutorials/tuto-bubbleshooter.jpg'), en: require('../assets/tutorials/tuto-bubbleshooter.en.jpg') },
  pipepuzzle: { fr: require('../assets/tutorials/tuto-pipepuzzle.jpg'), en: require('../assets/tutorials/tuto-pipepuzzle.en.jpg') },
  solitaire: { fr: require('../assets/tutorials/tuto-solitaire.jpg'), en: require('../assets/tutorials/tuto-solitaire.en.jpg') },
  runner: { fr: require('../assets/tutorials/tuto-runner.jpg'), en: require('../assets/tutorials/tuto-runner.en.jpg') },
  labyrinthe: { fr: require('../assets/tutorials/tuto-labyrinthe.jpg'), en: require('../assets/tutorials/tuto-labyrinthe.en.jpg') },
  nonogram: { fr: require('../assets/tutorials/tuto-nonogram.jpg'), en: require('../assets/tutorials/tuto-nonogram.en.jpg') },
  whackamole: { fr: require('../assets/tutorials/tuto-whackamole.jpg'), en: require('../assets/tutorials/tuto-whackamole.en.jpg') },
  dodgeball: { fr: require('../assets/tutorials/tuto-dodgeball.jpg'), en: require('../assets/tutorials/tuto-dodgeball.en.jpg') },
  cassebriques: { fr: require('../assets/tutorials/tuto-cassebriques.jpg'), en: require('../assets/tutorials/tuto-cassebriques.en.jpg') },
  rythme: { fr: require('../assets/tutorials/tuto-rythme.jpg'), en: require('../assets/tutorials/tuto-rythme.en.jpg') },
  slidingpuzzle: { fr: require('../assets/tutorials/tuto-slidingpuzzle.jpg'), en: require('../assets/tutorials/tuto-slidingpuzzle.en.jpg') },
  match3: { fr: require('../assets/tutorials/tuto-match3.jpg'), en: require('../assets/tutorials/tuto-match3.en.jpg') },
  flappy: { fr: require('../assets/tutorials/tuto-flappy.jpg'), en: require('../assets/tutorials/tuto-flappy.en.jpg') },
  pairs: { fr: require('../assets/tutorials/tuto-pairs.jpg'), en: require('../assets/tutorials/tuto-pairs.en.jpg') },
  wordsearch: { fr: require('../assets/tutorials/tuto-wordsearch.jpg'), en: require('../assets/tutorials/tuto-wordsearch.en.jpg') },
  game2048: { fr: require('../assets/tutorials/tuto-game2048.jpg'), en: require('../assets/tutorials/tuto-game2048.en.jpg') },
};

const STEPS = {
  quiz: [
    { icon: '👆', text: { fr: 'Touche la bonne réponse parmi les 4 propositions.', en: 'Tap the right answer out of the 4 options.' } },
    { icon: '✅', text: { fr: '10 questions tirées au hasard : il faut au moins 6 bonnes réponses.', en: '10 random questions: you need at least 6 right answers.' } },
    { icon: '💡', text: { fr: 'Un indice élimine 2 mauvaises réponses.', en: 'A hint removes 2 wrong answers.' } },
  ],
  stack: [
    { icon: '👆', text: { fr: 'Touche l’écran pour lâcher le bloc qui se balance.', en: 'Tap the screen to drop the swinging block.' } },
    { icon: '✂️', text: { fr: 'Ce qui dépasse de la tour est coupé : le bloc suivant est plus petit.', en: 'Whatever overhangs the tower is cut off: the next block is smaller.' } },
    { icon: '🎯', text: { fr: 'Bien aligné, le bloc garde sa taille. Plus ton dernier bloc est large, plus tu gagnes de points ; objectif atteint, continue pour des points bonus !', en: 'Line it up well and the block keeps its size. The wider your last block, the more points; goal reached? Keep going for bonus points!' } },
  ],
  sudoku: [
    { icon: '👆', text: { fr: 'Choisis une case vide, puis touche un chiffre en bas.', en: 'Pick an empty square, then tap a number at the bottom.' } },
    { icon: '🔢', text: { fr: 'Chaque ligne, colonne et carré 3×3 contient les chiffres 1 à 9, une seule fois.', en: 'Each row, column and 3×3 box contains the numbers 1 to 9, once each.' } },
    { icon: '✏️', text: { fr: 'Mode Notes : écris des chiffres en petit pour garder les solutions possibles d’une case.', en: 'Notes mode: write small numbers to keep track of a square’s possible answers.' } },
  ],
  spaceinvaders: [
    { icon: '🚀', text: { fr: 'Garde le doigt appuyé et glisse pour déplacer ta fusée : elle tire des boules de neige toute seule.', en: 'Keep your finger down and slide to move your rocket: it fires snowballs on its own.' } },
    { icon: '❤️', text: { fr: 'Esquive les glaçons : tu as 3 vies. Les lutins du haut rapportent le plus.', en: 'Dodge the icicles: you have 3 lives. The top elves are worth the most.' } },
    { icon: '💡', text: { fr: 'Le bouton doré « Tir triple » (en haut à droite) tire 3 boules de neige pendant 6 s. Touche aussi le traîneau de Grimnoir qui passe : +300 !', en: 'The gold “Triple shot” button (top right) fires 3 snowballs for 6 s. Also hit Grimnoir’s passing sleigh: +300!' } },
  ],
  snake: [
    { icon: '👉', text: { fr: 'Touche les flèches sous la grille (ou glisse le doigt) pour faire tourner la guirlande.', en: 'Tap the arrows under the grid (or swipe) to turn the garland.' } },
    { icon: '🍎', text: { fr: 'Mange au moins 15 pommes pour gagner, puis continue pour des points bonus : chaque pomme accélère la guirlande.', en: 'Eat at least 15 apples to win, then keep going for bonus points: every apple speeds the garland up.' } },
    { icon: '💥', text: { fr: 'Tu traverses les bords, mais ne te mords pas la queue !', en: 'You can go through the edges, but don’t bite your own tail!' } },
  ],
  dessinconnecte: [
    { icon: '1️⃣', text: { fr: 'Pose le doigt sur le point 1.', en: 'Put your finger on dot 1.' } },
    { icon: '✍️', text: { fr: 'Sans lever le doigt, passe sur les points dans l’ordre : 2, 3, 4…', en: 'Without lifting your finger, go over the dots in order: 2, 3, 4…' } },
    { icon: '🖼️', text: { fr: 'Au dernier point, le dessin est terminé. Le plus vite possible !', en: 'At the last dot, the drawing is done. As fast as you can!' } },
  ],
  fruitninja: [
    { icon: '👉', text: { fr: 'Glisse le doigt sur les friandises pour les trancher.', en: 'Swipe across the treats to slice them.' } },
    { icon: '💣', text: { fr: 'Ne touche pas les bombes entourées de rouge !', en: 'Don’t touch the bombs circled in red!' } },
    { icon: '🍪', text: { fr: 'Ne laisse pas trop de friandises retomber sans les couper.', en: 'Don’t let too many treats fall without slicing them.' } },
  ],
  memory_sequence: [
    { icon: '👀', text: { fr: 'Touche « Je suis prêt », puis regarde bien : les couleurs s’allument l’une après l’autre.', en: 'Tap “I’m ready”, then watch closely: the colours light up one after another.' } },
    { icon: '👆', text: { fr: 'Quand « À toi ! » s’affiche, touche les couleurs dans le même ordre.', en: 'When “Your turn!” appears, tap the colours in the same order.' } },
    { icon: '📈', text: { fr: 'À chaque manche, la séquence s’allonge.', en: 'Each round, the sequence gets longer.' } },
  ],
  bubbleshooter: [
    { icon: '👉', text: { fr: 'Glisse le doigt pour viser : la ligne pointillée montre le tir.', en: 'Slide your finger to aim: the dotted line shows the shot.' } },
    { icon: '🫧', text: { fr: 'Relâche pour tirer la bulle « À tirer ».', en: 'Let go to shoot the “Shoot” bubble.' } },
    { icon: '💥', text: { fr: '3 bulles de même couleur ou plus éclatent. Vide le plafond !', en: '3 or more bubbles of the same colour pop. Clear the ceiling!' } },
  ],
  pipepuzzle: [
    { icon: '👆', text: { fr: 'Touche un tuyau pour le faire tourner.', en: 'Tap a pipe to rotate it.' } },
    { icon: '🟢', text: { fr: 'Les tuyaux reliés à la Source deviennent verts.', en: 'Pipes connected to the Source turn green.' } },
    { icon: '🏁', text: { fr: 'Relie la Source à la Sortie pour gagner.', en: 'Connect the Source to the Exit to win.' } },
  ],
  solitaire: [
    { icon: '✋', text: { fr: 'Fais glisser les cartes en alternant rouge et noir, en descendant (10 sur valet…).', en: 'Drag cards alternating red and black, in descending order (10 on a jack…).' } },
    { icon: '🂠', text: { fr: 'Touche la pioche pour retourner une nouvelle carte.', en: 'Tap the stock pile to turn over a new card.' } },
    { icon: '🏆', text: { fr: 'Range les 4 familles de l’As au Roi en haut. ↩ annule le dernier coup.', en: 'Build the 4 suits from Ace to King at the top. ↩ undoes the last move.' } },
  ],
  runner: [
    { icon: '👆', text: { fr: 'Touche pour sauter, touche encore en l’air pour un double saut.', en: 'Tap to jump, tap again in the air to double jump.' } },
    { icon: '👇', text: { fr: 'Glisse vers le bas pour passer sous les stalactites.', en: 'Swipe down to slide under the stalactites.' } },
    { icon: '⏱️', text: { fr: 'Tiens 60 secondes sans te faire toucher.', en: 'Last 60 seconds without getting hit.' } },
  ],
  labyrinthe: [
    { icon: '👉', text: { fr: 'Glisse dans une direction : tu avances jusqu’au prochain croisement.', en: 'Swipe in a direction: you move to the next junction.' } },
    { icon: '🌑', text: { fr: 'Il fait noir : ta torche n’éclaire qu’autour de toi. Trouve le chemin jusqu’au 🎁.', en: 'It’s dark: your torch only lights up around you. Find your way to the 🎁.' } },
    { icon: '🔥', text: { fr: 'La torche se consume : ramasse les 🔥 en chemin pour +10 s avant qu’elle s’éteigne.', en: 'The torch burns down: grab the 🔥 on the way for +10 s before it goes out.' } },
  ],
  nonogram: [
    { icon: '🔢', text: { fr: 'Chaque chiffre est un groupe de cases pleines qui se suivent, dans l’ordre de la ligne ou de la colonne.', en: 'Each number is a group of consecutive filled squares, in the order of the row or column.' } },
    { icon: '👆', text: { fr: 'Touche une case pour la noircir, retouche pour la vider.', en: 'Tap a square to fill it, tap again to clear it.' } },
    { icon: '🖼️', text: { fr: 'Quand toutes les lignes sont justes, le dessin apparaît.', en: 'When every row is right, the picture appears.' } },
  ],
  whackamole: [
    { icon: '👆', text: { fr: 'Tape les gobelins dès qu’ils sortent de leur trou.', en: 'Hit the goblins as soon as they pop out of their holes.' } },
    { icon: '⚠️', text: { fr: 'Ne touche pas les faux fragments qui scintillent.', en: 'Don’t touch the sparkling fake shards.' } },
    { icon: '⏱️', text: { fr: 'Marque un maximum de points en 45 secondes.', en: 'Score as many points as you can in 45 seconds.' } },
  ],
  dodgeball: [
    { icon: '👉', text: { fr: 'Garde le doigt appuyé et glisse pour déplacer ton personnage.', en: 'Keep your finger down and slide to move your character.' } },
    { icon: '☄️', text: { fr: 'Esquive les boules de neige, comètes et fantômes.', en: 'Dodge the snowballs, comets and ghosts.' } },
    { icon: '🎁', text: { fr: 'Attrape les cadeaux pour des points en plus et survis jusqu’au bout du temps. 💡 Le bouclier arrête un projectile.', en: 'Catch the presents for extra points and survive until time runs out. 💡 The shield stops one projectile.' } },
  ],
  cassebriques: [
    { icon: '👉', text: { fr: 'Glisse le doigt pour déplacer la raquette.', en: 'Slide your finger to move the paddle.' } },
    { icon: '🧊', text: { fr: 'Fais rebondir la balle pour casser tous les blocs de glace.', en: 'Bounce the ball to break all the ice blocks.' } },
    { icon: '⚠️', text: { fr: 'Ne laisse pas tomber la balle et méfie-toi des pièges.', en: 'Don’t drop the ball and watch out for traps.' } },
  ],
  rythme: [
    { icon: '🎵', text: { fr: 'Les notes descendent sur 4 colonnes, au rythme de la musique.', en: 'Notes fall down 4 columns, in time with the music.' } },
    { icon: '👆', text: { fr: 'Touche la colonne quand la note arrive sur la ligne.', en: 'Tap the column when the note reaches the line.' } },
    { icon: '🎯', text: { fr: 'Touche au moins 70 % des notes pour gagner.', en: 'Hit at least 70% of the notes to win.' } },
  ],
} satisfies Record<string, TutorialStep[]>;

// Sur ordi : clavier (ou souris quand le clavier n'a pas de sens)
const KEYBOARD = {
  quiz: { fr: 'touches 1 à 4 (ou A à D) pour répondre.', en: 'keys 1 to 4 (or A to D) to answer.' },
  stack: { fr: 'Espace, Entrée ou ↓ pour lâcher le bloc.', en: 'Space, Enter or ↓ to drop the block.' },
  sudoku: { fr: 'flèches pour choisir la case, 1 à 9 pour écrire, Retour arrière pour effacer, N pour les notes.', en: 'arrows to pick a square, 1 to 9 to write, Backspace to erase, N for notes.' },
  spaceinvaders: { fr: '← → pour bouger, Espace (maintenu) pour tirer, H pour le tir triple.', en: '← → to move, hold Space to shoot, H for the triple shot.' },
  snake: { fr: 'les flèches pour tourner.', en: 'arrow keys to turn.' },
  dessinconnecte: { fr: 'maintiens le clic de la souris et passe sur les points.', en: 'hold the mouse button and go over the dots.' },
  fruitninja: { fr: 'maintiens le clic de la souris et glisse sur les friandises.', en: 'hold the mouse button and swipe across the treats.' },
  memory_sequence: { fr: 'Espace pour commencer, puis touches 1 à 4 (1 2 en haut, 3 4 en bas).', en: 'Space to start, then keys 1 to 4 (1 2 at the top, 3 4 at the bottom).' },
  bubbleshooter: { fr: '← → pour viser, Espace ou ↑ pour tirer (ou vise à la souris et clique).', en: '← → to aim, Space or ↑ to shoot (or aim with the mouse and click).' },
  pipepuzzle: { fr: 'clique sur un tuyau pour le tourner.', en: 'click a pipe to rotate it.' },
  solitaire: { fr: 'fais glisser les cartes à la souris.', en: 'drag the cards with the mouse.' },
  runner: { fr: 'Espace ou ↑ pour sauter, ↓ pour glisser.', en: 'Space or ↑ to jump, ↓ to slide.' },
  labyrinthe: { fr: 'les flèches pour avancer.', en: 'arrow keys to move.' },
  nonogram: { fr: 'clique sur les cases.', en: 'click the squares.' },
  whackamole: { fr: 'touches 1 à 9 comme un pavé numérique (7 8 9 = rangée du haut).', en: 'keys 1 to 9 like a number pad (7 8 9 = top row).' },
  dodgeball: { fr: '← → pour te déplacer.', en: '← → to move.' },
  cassebriques: { fr: '← → pour la raquette, Espace pour lancer la balle.', en: '← → for the paddle, Space to launch the ball.' },
  rythme: { fr: 'D F J K (ou 1 2 3 4) pour les 4 colonnes.', en: 'D F J K (or 1 2 3 4) for the 4 columns.' },
} satisfies Record<keyof typeof STEPS, Localized>;

type SimpleGame = keyof typeof STEPS;

const simple = (game: SimpleGame): GameTutorial => ({ images: [{ source: IMAGES[game] }], steps: STEPS[game], keyboard: KEYBOARD[game] });

const CHAIN_STEP: TutorialStep = {
  icon: '❗',
  text: { fr: 'Les épreuves s’enchaînent : un seul échec et tout est à refaire.', en: 'The trials follow each other: fail once and you start over.' },
};

const NEW_GAMES: Record<ExtraGameType, GameTutorial> = {
  slidingpuzzle: {
    images: [{ source: IMAGES.slidingpuzzle }],
    steps: [
      { icon: '🧩', text: { fr: 'Taquin : touche une pièce voisine de la case vide pour la faire glisser.', en: 'Sliding puzzle: tap a piece next to the empty square to slide it.' } },
      { icon: '🖼️', text: { fr: 'Remets les pièces 1 à 8 dans l’ordre pour reconstituer l’image.', en: 'Put pieces 1 to 8 back in order to rebuild the picture.' } },
      { icon: '⏱️', text: { fr: 'Avant la fin du temps. 💡 L’indice joue le bon coup à ta place.', en: 'Before time runs out. 💡 The hint plays the right move for you.' } },
    ],
    keyboard: { fr: 'les flèches font glisser une pièce vers la case vide.', en: 'arrow keys slide a piece into the empty square.' },
  },
  match3: {
    images: [{ source: IMAGES.match3 }],
    steps: [
      { icon: '🍬', text: { fr: 'Friandises (comme Candy Crush) : échange deux friandises voisines pour en aligner 3 ou plus.', en: 'Treats (like Candy Crush): swap two neighbouring treats to line up 3 or more.' } },
      { icon: '⛓️', text: { fr: 'Les réactions en chaîne rapportent de plus en plus de points.', en: 'Chain reactions earn more and more points.' } },
      { icon: '🎯', text: { fr: 'Atteins le score demandé avant la fin des 25 échanges.', en: 'Reach the target score within 25 swaps.' } },
    ],
    keyboard: { fr: 'clique sur une friandise puis sur sa voisine.', en: 'click a treat, then its neighbour.' },
  },
  flappy: {
    images: [{ source: IMAGES.flappy }],
    steps: [
      { icon: '🦌', text: { fr: 'Envol du renne : touche l’écran pour battre des ailes et passe entre les colonnes de glace.', en: 'Reindeer flight: tap the screen to flap and fly between the ice columns.' } },
      { icon: '✨', text: { fr: 'Attrape les étoiles pour des points en plus. Ne touche ni les colonnes ni le sol.', en: 'Grab the stars for extra points. Don’t touch the columns or the ground.' } },
      { icon: '🎉', text: { fr: 'Objectif atteint ? Continue pour des points bonus. 💡 Le bouclier encaisse un choc.', en: 'Goal reached? Keep going for bonus points. 💡 The shield takes one hit.' } },
    ],
    keyboard: { fr: 'Espace ou ↑ pour battre des ailes.', en: 'Space or ↑ to flap.' },
  },
  pairs: {
    images: [{ source: IMAGES.pairs }],
    steps: [
      { icon: '🃏', text: { fr: 'Paires : retourne deux cartes ; identiques, elles restent visibles.', en: 'Pairs: turn over two cards; if they match, they stay face up.' } },
      { icon: '🧠', text: { fr: 'Retiens où sont les cartes déjà vues.', en: 'Remember where the cards you’ve seen are.' } },
      { icon: '⏱️', text: { fr: 'Trouve toutes les paires avant la fin du temps. 💡 L’indice montre toutes les cartes un instant.', en: 'Find every pair before time runs out. 💡 The hint shows all the cards for a moment.' } },
    ],
    keyboard: { fr: 'clique sur les cartes.', en: 'click the cards.' },
  },
  wordsearch: {
    images: [{ source: IMAGES.wordsearch }],
    steps: [
      { icon: '🔤', text: { fr: 'Mots mêlés : glisse de la première à la dernière lettre d’un mot.', en: 'Word search: swipe from the first to the last letter of a word.' } },
      { icon: '↘️', text: { fr: 'Les mots sont en ligne, en colonne ou en diagonale (parfois à l’envers).', en: 'Words go across, down or diagonally (sometimes backwards).' } },
      { icon: '⏱️', text: { fr: 'Trouve tous les mots de la liste avant la fin du temps.', en: 'Find every word in the list before time runs out.' } },
    ],
    keyboard: { fr: 'maintiens le clic de la première à la dernière lettre.', en: 'hold the mouse button from the first to the last letter.' },
  },
  game2048: {
    images: [{ source: IMAGES.game2048 }],
    steps: [
      { icon: '👉', text: { fr: '2048 : glisse pour pousser toutes les tuiles dans une direction.', en: '2048: swipe to push every tile in one direction.' } },
      { icon: '❄️', text: { fr: 'Deux objets identiques fusionnent : ❄️ → ⛄ → 🍪 → 🍭 → 🧦 → 🔔 → 🎄…', en: 'Two identical items merge: ❄️ → ⛄ → 🍪 → 🍭 → 🧦 → 🔔 → 🎄…' } },
      { icon: '🎯', text: { fr: 'Atteins l’objet demandé avant que la grille soit bloquée, puis continue pour le record.', en: 'Reach the target item before the grid locks up, then keep going for your record.' } },
    ],
    keyboard: { fr: 'les flèches pour pousser les tuiles.', en: 'arrow keys to push the tiles.' },
  },
};

export const TUTORIALS: Record<GameType, GameTutorial> = {
  quiz: simple('quiz'),
  stack: simple('stack'),
  sudoku: simple('sudoku'),
  spaceinvaders: simple('spaceinvaders'),
  snake: simple('snake'),
  dessinconnecte: simple('dessinconnecte'),
  fruitninja: simple('fruitninja'),
  memory_sequence: simple('memory_sequence'),
  bubbleshooter: simple('bubbleshooter'),
  pipepuzzle: simple('pipepuzzle'),
  solitaire: simple('solitaire'),
  runner: simple('runner'),
  labyrinthe: simple('labyrinthe'),
  nonogram: simple('nonogram'),
  whackamole: simple('whackamole'),
  dodgeball: simple('dodgeball'),
  cassebriques: simple('cassebriques'),
  rythme: simple('rythme'),
  // Marathons et boss : une image par épreuve, dans l'ordre
  // Mini-jeux des épreuves 22 à 24
  ...NEW_GAMES,
  // Marathons et boss : les règles de chaque épreuve, dans l'ordre
  marathon_22: {
    images: [],
    sections: [
      { title: { fr: 'Épreuve 1 · Taquin', en: 'Trial 1 · Sliding puzzle' }, image: IMAGES.slidingpuzzle, steps: NEW_GAMES.slidingpuzzle.steps },
      { title: { fr: 'Épreuve 2 · Friandises', en: 'Trial 2 · Treats' }, image: IMAGES.match3, steps: NEW_GAMES.match3.steps },
    ],
    steps: [CHAIN_STEP],
    keyboard: {
      fr: 'Taquin : flèches · Friandises : clic sur deux friandises voisines.',
      en: 'Sliding puzzle: arrows · Treats: click two neighbouring treats.',
    },
  },
  marathon_23: {
    images: [],
    sections: [
      { title: { fr: 'Épreuve 1 · Envol du renne', en: 'Trial 1 · Reindeer flight' }, image: IMAGES.flappy, steps: NEW_GAMES.flappy.steps },
      { title: { fr: 'Épreuve 2 · Paires', en: 'Trial 2 · Pairs' }, image: IMAGES.pairs, steps: NEW_GAMES.pairs.steps },
      { title: { fr: 'Épreuve 3 · Mots mêlés', en: 'Trial 3 · Word search' }, image: IMAGES.wordsearch, steps: NEW_GAMES.wordsearch.steps },
    ],
    steps: [CHAIN_STEP],
    keyboard: {
      fr: 'Renne : Espace ou ↑ · Paires et mots mêlés : à la souris.',
      en: 'Reindeer: Space or ↑ · Pairs and word search: with the mouse.',
    },
  },
  boss: {
    images: [],
    sections: [
      { title: { fr: 'Épreuve 1 · Casse-briques', en: 'Trial 1 · Brick Breaker' }, image: IMAGES.cassebriques, steps: STEPS.cassebriques },
      {
        title: { fr: 'Épreuve 2 · 2048', en: 'Trial 2 · 2048' },
        image: IMAGES.game2048,
        steps: [
          NEW_GAMES.game2048.steps[0],
          NEW_GAMES.game2048.steps[1],
          { icon: '🎄', text: { fr: 'Atteins le sapin 🎄 (128) avant que la grille soit bloquée.', en: 'Reach the tree 🎄 (128) before the grid locks up.' } },
        ],
      },
      {
        title: { fr: 'Épreuve 3 · Quiz final', en: 'Trial 3 · Final quiz' },
        image: IMAGES.quiz,
        steps: [STEPS.quiz[0], STEPS.quiz[1], { icon: '🚫', text: { fr: 'Aucun indice contre Grimnoir !', en: 'No hints against Grimnoir!' } }],
      },
    ],
    steps: [CHAIN_STEP],
    keyboard: { fr: 'Casse-briques : ← → et Espace · 2048 : flèches · Quiz : touches 1 à 4.', en: 'Brick Breaker: ← → and Space · 2048: arrows · Quiz: keys 1 to 4.' },
  },
};
