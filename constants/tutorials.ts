import { ImageSourcePropType } from 'react-native';
import type { Localized } from '../services/i18n';
import { GameType } from './days';

// Tutoriels affichés avant de jouer : une capture du jeu en cours de partie + les règles en 3 étapes.
// Les captures (assets/tutorials) sont prises dans le navigateur, jeu lancé, en 393×796.

export interface TutorialStep {
  icon: string;
  text: Localized;
}

export interface GameTutorial {
  images: { source: ImageSourcePropType; caption?: Localized }[];
  steps: TutorialStep[];
  keyboard?: Localized; // commandes au clavier, affichées seulement sur ordi
}

const IMAGES = {
  quiz: require('../assets/tutorials/tuto-quiz.jpg'),
  stack: require('../assets/tutorials/tuto-stack.jpg'),
  sudoku: require('../assets/tutorials/tuto-sudoku.jpg'),
  spaceinvaders: require('../assets/tutorials/tuto-spaceinvaders.jpg'),
  snake: require('../assets/tutorials/tuto-snake.jpg'),
  dessinconnecte: require('../assets/tutorials/tuto-dessinconnecte.jpg'),
  fruitninja: require('../assets/tutorials/tuto-fruitninja.jpg'),
  memory_sequence: require('../assets/tutorials/tuto-memory_sequence.jpg'),
  bubbleshooter: require('../assets/tutorials/tuto-bubbleshooter.jpg'),
  pipepuzzle: require('../assets/tutorials/tuto-pipepuzzle.jpg'),
  solitaire: require('../assets/tutorials/tuto-solitaire.jpg'),
  runner: require('../assets/tutorials/tuto-runner.jpg'),
  labyrinthe: require('../assets/tutorials/tuto-labyrinthe.jpg'),
  nonogram: require('../assets/tutorials/tuto-nonogram.jpg'),
  whackamole: require('../assets/tutorials/tuto-whackamole.jpg'),
  dodgeball: require('../assets/tutorials/tuto-dodgeball.jpg'),
  cassebriques: require('../assets/tutorials/tuto-cassebriques.jpg'),
  rythme: require('../assets/tutorials/tuto-rythme.jpg'),
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
    { icon: '🎯', text: { fr: 'Bien aligné, le bloc garde sa taille. Monte le plus haut possible !', en: 'Line it up well and the block keeps its size. Build as high as you can!' } },
  ],
  sudoku: [
    { icon: '👆', text: { fr: 'Choisis une case vide, puis touche un chiffre en bas.', en: 'Pick an empty square, then tap a number at the bottom.' } },
    { icon: '🔢', text: { fr: 'Chaque ligne, colonne et carré 3×3 contient les chiffres 1 à 9, une seule fois.', en: 'Each row, column and 3×3 box contains the numbers 1 to 9, once each.' } },
    { icon: '✏️', text: { fr: 'Mode Notes : écris des chiffres en petit pour garder les solutions possibles d’une case.', en: 'Notes mode: write small numbers to keep track of a square’s possible answers.' } },
  ],
  spaceinvaders: [
    { icon: '👉', text: { fr: 'Garde le doigt appuyé et glisse pour déplacer ton vaisseau.', en: 'Keep your finger down and slide to move your ship.' } },
    { icon: '🔫', text: { fr: 'Il tire tout seul tant que tu appuies.', en: 'It fires on its own as long as you hold.' } },
    { icon: '👾', text: { fr: 'Détruis toutes les vagues avant que les ennemis n’arrivent en bas.', en: 'Destroy every wave before the enemies reach the bottom.' } },
  ],
  snake: [
    { icon: '👉', text: { fr: 'Glisse le doigt dans une direction pour faire tourner la guirlande.', en: 'Swipe in a direction to turn the garland.' } },
    { icon: '🍎', text: { fr: 'Mange un maximum de pommes en 45 secondes.', en: 'Eat as many apples as you can in 45 seconds.' } },
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
    { icon: '🧭', text: { fr: 'Trouve le chemin jusqu’à la sortie.', en: 'Find your way to the exit.' } },
    { icon: '🔥', text: { fr: 'Dépêche-toi avant que la torche ne s’éteigne.', en: 'Hurry before the torch goes out.' } },
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
    { icon: '🛡️', text: { fr: 'Attrape les boucliers et survis 60 secondes.', en: 'Grab the shields and survive 60 seconds.' } },
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
  spaceinvaders: { fr: '← → pour bouger, Espace (maintenu) pour tirer.', en: '← → to move, hold Space to shoot.' },
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
  marathon_22: {
    images: [
      { source: IMAGES.spaceinvaders, caption: { fr: '1. Space Invaders', en: '1. Space Invaders' } },
      { source: IMAGES.bubbleshooter, caption: { fr: '2. Bubble Shooter', en: '2. Bubble Shooter' } },
    ],
    steps: [
      { icon: '👾', text: { fr: 'Épreuve 1 : glisse pour déplacer le vaisseau, il tire tout seul.', en: 'Trial 1: slide to move the ship, it fires on its own.' } },
      { icon: '🫧', text: { fr: 'Épreuve 2 : vise en glissant, relâche pour tirer, éclate les bulles par 3.', en: 'Trial 2: slide to aim, let go to shoot, pop the bubbles in threes.' } },
      { icon: '❗', text: { fr: 'Les deux épreuves s’enchaînent : un seul échec et tout est à refaire.', en: 'The two trials follow each other: fail once and you start over.' } },
    ],
    keyboard: { fr: 'Space Invaders : ← → et Espace pour tirer · Bubble Shooter : ← → pour viser, Espace pour tirer.', en: 'Space Invaders: ← → and Space to shoot · Bubble Shooter: ← → to aim, Space to shoot.' },
  },
  marathon_23: {
    images: [
      { source: IMAGES.dodgeball, caption: { fr: '1. Dodge Ball', en: '1. Dodge Ball' } },
      { source: IMAGES.nonogram, caption: { fr: '2. Nonogram', en: '2. Nonogram' } },
    ],
    steps: [
      { icon: '🛡️', text: { fr: 'Épreuve 1 : glisse pour esquiver les projectiles pendant 60 secondes.', en: 'Trial 1: slide to dodge the projectiles for 60 seconds.' } },
      { icon: '🎄', text: { fr: 'Épreuve 2 : noircis les cases grâce aux chiffres pour révéler le sapin.', en: 'Trial 2: use the numbers to fill in squares and reveal the fir tree.' } },
      { icon: '❗', text: { fr: 'Les deux épreuves s’enchaînent : un seul échec et tout est à refaire.', en: 'The two trials follow each other: fail once and you start over.' } },
    ],
    keyboard: { fr: 'Dodge Ball : ← → pour te déplacer · Nonogram : clique sur les cases.', en: 'Dodge Ball: ← → to move · Nonogram: click the squares.' },
  },
  boss: {
    images: [
      { source: IMAGES.stack, caption: { fr: '1. Stack', en: '1. Stack' } },
      { source: IMAGES.cassebriques, caption: { fr: '2. Casse-briques', en: '2. Brick Breaker' } },
      { source: IMAGES.quiz, caption: { fr: '3. Quiz final', en: '3. Final quiz' } },
    ],
    steps: [
      { icon: '🧱', text: { fr: 'Épreuve 1 : touche pour empiler les blocs de la tour du Cœur.', en: 'Trial 1: tap to stack the blocks of the Heart’s tower.' } },
      { icon: '🧊', text: { fr: 'Épreuve 2 : casse l’armure de glace avec la balle et la raquette.', en: 'Trial 2: break the ice armour with the ball and paddle.' } },
      { icon: '❓', text: { fr: 'Épreuve 3 : réponds aux questions de Grimnoir. Aucun indice, aucune erreur permise !', en: 'Trial 3: answer Grimnoir’s questions. No hints, no mistakes allowed!' } },
    ],
    keyboard: { fr: 'Stack : Espace · Casse-briques : ← → et Espace · Quiz : touches 1 à 4.', en: 'Stack: Space · Brick Breaker: ← → and Space · Quiz: keys 1 to 4.' },
  },
};
