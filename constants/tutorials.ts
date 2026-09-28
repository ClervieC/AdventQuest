import { ImageSourcePropType } from 'react-native';
import { GameType } from './days';

// Tutoriels affichés avant de jouer : une capture du jeu en cours de partie + les règles en 3 étapes.
// Les captures (assets/tutorials) sont prises dans le navigateur, jeu lancé, en 393×796.

export interface TutorialStep {
  icon: string;
  text: string;
}

export interface GameTutorial {
  images: { source: ImageSourcePropType; caption?: string }[];
  steps: TutorialStep[];
  keyboard?: string; // commandes au clavier, affichées seulement sur ordi
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
    { icon: '👆', text: 'Touche la bonne réponse parmi les 4 propositions.' },
    { icon: '✅', text: '10 questions tirées au hasard : il faut au moins 6 bonnes réponses.' },
    { icon: '💡', text: 'Un indice élimine 2 mauvaises réponses.' },
  ],
  stack: [
    { icon: '👆', text: 'Touche l’écran pour lâcher le bloc qui se balance.' },
    { icon: '✂️', text: 'Ce qui dépasse de la tour est coupé : le bloc suivant est plus petit.' },
    { icon: '🎯', text: 'Bien aligné, le bloc garde sa taille. Monte le plus haut possible !' },
  ],
  sudoku: [
    { icon: '👆', text: 'Choisis une case vide, puis touche un chiffre en bas.' },
    { icon: '🔢', text: 'Chaque ligne, colonne et carré 3×3 contient les chiffres 1 à 9, une seule fois.' },
    { icon: '✏️', text: 'Mode Notes : écris des chiffres en petit pour garder les solutions possibles d’une case.' },
  ],
  spaceinvaders: [
    { icon: '👉', text: 'Garde le doigt appuyé et glisse pour déplacer ton vaisseau.' },
    { icon: '🔫', text: 'Il tire tout seul tant que tu appuies.' },
    { icon: '👾', text: 'Détruis toutes les vagues avant que les ennemis n’arrivent en bas.' },
  ],
  snake: [
    { icon: '👉', text: 'Glisse le doigt dans une direction pour faire tourner la guirlande.' },
    { icon: '🍎', text: 'Mange un maximum de pommes en 45 secondes.' },
    { icon: '💥', text: 'Tu traverses les bords, mais ne te mords pas la queue !' },
  ],
  dessinconnecte: [
    { icon: '1️⃣', text: 'Pose le doigt sur le point 1.' },
    { icon: '✍️', text: 'Sans lever le doigt, passe sur les points dans l’ordre : 2, 3, 4…' },
    { icon: '🖼️', text: 'Au dernier point, le dessin est terminé. Le plus vite possible !' },
  ],
  fruitninja: [
    { icon: '👉', text: 'Glisse le doigt sur les friandises pour les trancher.' },
    { icon: '💣', text: 'Ne touche pas les bombes entourées de rouge !' },
    { icon: '🍪', text: 'Ne laisse pas trop de friandises retomber sans les couper.' },
  ],
  memory_sequence: [
    { icon: '👀', text: 'Touche « Je suis prêt », puis regarde bien : les couleurs s’allument l’une après l’autre.' },
    { icon: '👆', text: 'Quand « À toi ! » s’affiche, touche les couleurs dans le même ordre.' },
    { icon: '📈', text: 'À chaque manche, la séquence s’allonge.' },
  ],
  bubbleshooter: [
    { icon: '👉', text: 'Glisse le doigt pour viser : la ligne pointillée montre le tir.' },
    { icon: '🫧', text: 'Relâche pour tirer la bulle « À tirer ».' },
    { icon: '💥', text: '3 bulles de même couleur ou plus éclatent. Vide le plafond !' },
  ],
  pipepuzzle: [
    { icon: '👆', text: 'Touche un tuyau pour le faire tourner.' },
    { icon: '🟢', text: 'Les tuyaux reliés à la Source deviennent verts.' },
    { icon: '🏁', text: 'Relie la Source à la Sortie pour gagner.' },
  ],
  solitaire: [
    { icon: '✋', text: 'Fais glisser les cartes en alternant rouge et noir, en descendant (10 sur valet…).' },
    { icon: '🂠', text: 'Touche la pioche pour retourner une nouvelle carte.' },
    { icon: '🏆', text: 'Range les 4 familles de l’As au Roi en haut. ↩ annule le dernier coup.' },
  ],
  runner: [
    { icon: '👆', text: 'Touche pour sauter, touche encore en l’air pour un double saut.' },
    { icon: '👇', text: 'Glisse vers le bas pour passer sous les stalactites.' },
    { icon: '⏱️', text: 'Tiens 60 secondes sans te faire toucher.' },
  ],
  labyrinthe: [
    { icon: '👉', text: 'Glisse dans une direction : tu avances jusqu’au prochain croisement.' },
    { icon: '🧭', text: 'Trouve le chemin jusqu’à la sortie.' },
    { icon: '🔥', text: 'Dépêche-toi avant que la torche ne s’éteigne.' },
  ],
  nonogram: [
    { icon: '🔢', text: 'Chaque chiffre est un groupe de cases pleines qui se suivent, dans l’ordre de la ligne ou de la colonne.' },
    { icon: '👆', text: 'Touche une case pour la noircir, retouche pour la vider.' },
    { icon: '🖼️', text: 'Quand toutes les lignes sont justes, le dessin apparaît.' },
  ],
  whackamole: [
    { icon: '👆', text: 'Tape les gobelins dès qu’ils sortent de leur trou.' },
    { icon: '⚠️', text: 'Ne touche pas les faux fragments qui scintillent.' },
    { icon: '⏱️', text: 'Marque un maximum de points en 45 secondes.' },
  ],
  dodgeball: [
    { icon: '👉', text: 'Garde le doigt appuyé et glisse pour déplacer ton personnage.' },
    { icon: '☄️', text: 'Esquive les boules de neige, comètes et fantômes.' },
    { icon: '🛡️', text: 'Attrape les boucliers et survis 60 secondes.' },
  ],
  cassebriques: [
    { icon: '👉', text: 'Glisse le doigt pour déplacer la raquette.' },
    { icon: '🧊', text: 'Fais rebondir la balle pour casser tous les blocs de glace.' },
    { icon: '⚠️', text: 'Ne laisse pas tomber la balle et méfie-toi des pièges.' },
  ],
  rythme: [
    { icon: '🎵', text: 'Les notes descendent sur 4 colonnes, au rythme de la musique.' },
    { icon: '👆', text: 'Touche la colonne quand la note arrive sur la ligne.' },
    { icon: '🎯', text: 'Touche au moins 70 % des notes pour gagner.' },
  ],
} satisfies Record<string, TutorialStep[]>;

// Sur ordi : clavier (ou souris quand le clavier n'a pas de sens)
const KEYBOARD = {
  quiz: 'touches 1 à 4 (ou A à D) pour répondre.',
  stack: 'Espace, Entrée ou ↓ pour lâcher le bloc.',
  sudoku: 'flèches pour choisir la case, 1 à 9 pour écrire, Retour arrière pour effacer, N pour les notes.',
  spaceinvaders: '← → pour bouger, Espace (maintenu) pour tirer.',
  snake: 'les flèches pour tourner.',
  dessinconnecte: 'maintiens le clic de la souris et passe sur les points.',
  fruitninja: 'maintiens le clic de la souris et glisse sur les friandises.',
  memory_sequence: 'Espace pour commencer, puis touches 1 à 4 (1 2 en haut, 3 4 en bas).',
  bubbleshooter: '← → pour viser, Espace ou ↑ pour tirer (ou vise à la souris et clique).',
  pipepuzzle: 'clique sur un tuyau pour le tourner.',
  solitaire: 'fais glisser les cartes à la souris.',
  runner: 'Espace ou ↑ pour sauter, ↓ pour glisser.',
  labyrinthe: 'les flèches pour avancer.',
  nonogram: 'clique sur les cases.',
  whackamole: 'touches 1 à 9 comme un pavé numérique (7 8 9 = rangée du haut).',
  dodgeball: '← → pour te déplacer.',
  cassebriques: '← → pour la raquette, Espace pour lancer la balle.',
  rythme: 'D F J K (ou 1 2 3 4) pour les 4 colonnes.',
} satisfies Record<keyof typeof STEPS, string>;

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
      { source: IMAGES.spaceinvaders, caption: '1. Space Invaders' },
      { source: IMAGES.bubbleshooter, caption: '2. Bubble Shooter' },
    ],
    steps: [
      { icon: '👾', text: 'Épreuve 1 : glisse pour déplacer le vaisseau, il tire tout seul.' },
      { icon: '🫧', text: 'Épreuve 2 : vise en glissant, relâche pour tirer, éclate les bulles par 3.' },
      { icon: '❗', text: 'Les deux épreuves s’enchaînent : un seul échec et tout est à refaire.' },
    ],
    keyboard: 'Space Invaders : ← → et Espace pour tirer · Bubble Shooter : ← → pour viser, Espace pour tirer.',
  },
  marathon_23: {
    images: [
      { source: IMAGES.dodgeball, caption: '1. Dodge Ball' },
      { source: IMAGES.nonogram, caption: '2. Nonogram' },
    ],
    steps: [
      { icon: '🛡️', text: 'Épreuve 1 : glisse pour esquiver les projectiles pendant 60 secondes.' },
      { icon: '🎄', text: 'Épreuve 2 : noircis les cases grâce aux chiffres pour révéler le sapin.' },
      { icon: '❗', text: 'Les deux épreuves s’enchaînent : un seul échec et tout est à refaire.' },
    ],
    keyboard: 'Dodge Ball : ← → pour te déplacer · Nonogram : clique sur les cases.',
  },
  boss: {
    images: [
      { source: IMAGES.stack, caption: '1. Stack' },
      { source: IMAGES.cassebriques, caption: '2. Casse-briques' },
      { source: IMAGES.quiz, caption: '3. Quiz final' },
    ],
    steps: [
      { icon: '🧱', text: 'Épreuve 1 : touche pour empiler les blocs de la tour du Cœur.' },
      { icon: '🧊', text: 'Épreuve 2 : casse l’armure de glace avec la balle et la raquette.' },
      { icon: '❓', text: 'Épreuve 3 : réponds aux questions de Grimnoir. Aucun indice, aucune erreur permise !' },
    ],
    keyboard: 'Stack : Espace · Casse-briques : ← → et Espace · Quiz : touches 1 à 4.',
  },
};
