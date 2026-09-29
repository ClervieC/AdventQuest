import type { Localized } from '../services/i18n';
import type { ExtraGameType } from './extraGames';

export type GameType = 'quiz' | 'stack' | 'sudoku' | 'snake' | 'memory_sequence' | 'whackamole' | 'solitaire' | 'bubbleshooter' | 'labyrinthe' | 'pipepuzzle' | 'spaceinvaders' | 'dessinconnecte' | 'fruitninja' | 'nonogram' | 'runner' | 'dodgeball' | 'cassebriques' | 'marathon_22' | 'marathon_23' | 'boss' | 'rythme' | ExtraGameType;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'boss';


// La zone d'un jour se déduit de son numéro : voir getZoneForDay dans constants/zones.ts
export interface DayConfig {
  day: number;
  game: GameType;
  difficulty: Difficulty;
  fragmentName: Localized;
  fragmentIcon: string;
  storyIntro: Localized;
  gameDifficulty?: 'easy' | 'medium' | 'hard' | 'very_hard';
}


export const DAYS_CONFIG: DayConfig[] = [
  {
    day: 1,
    game: 'quiz',
    difficulty: 'easy',
    fragmentName: { fr: 'Éclat de lumière', en: "Shard of Light" },
    fragmentIcon: '✦',
    storyIntro: {
      fr: "Au centre du village figé, une vieille statue gardienne s'anime. Avant de te confier le premier fragment, elle veut vérifier que tu connais bien Noël : 10 questions tirées au hasard, 6 bonnes réponses au moins.",
      en: "In the middle of the frozen village, an old guardian statue comes to life. Before handing you the first shard, it wants to check that you know Christmas well: 10 random questions, at least 6 right answers.",
    },
  },
  {
    day: 2,
    game: 'stack',
    difficulty: 'medium',
    fragmentName: { fr: 'Graine de givre', en: "Frost Seed" },
    fragmentIcon: '❄️',
    storyIntro: {
      fr: "La fontaine de la place est gelée en couches épaisses. Empile les blocs de glace bien droit pour atteindre le fragment coincé tout en haut.",
      en: "The fountain on the square is frozen in thick layers. Stack the ice blocks nice and straight to reach the shard stuck at the very top.",
    },
  },
  {
    day: 3,
    game: 'sudoku',
    difficulty: 'medium',
    fragmentName: { fr: 'Cristal des heures', en: "Crystal of Hours" },
    fragmentIcon: '🕰️',
    storyIntro: {
      fr: "L'horloge magique de la mairie s'est arrêtée à minuit sur une grille de chiffres. Remplis-la pour relancer le temps du village.",
      en: "The magic clock on the town hall stopped at midnight on a grid of numbers. Fill it in to restart the village’s time.",
    },
  },
  {
    day: 4,
    game: 'spaceinvaders',
    difficulty: 'medium',
    fragmentName: { fr: 'Lanterne du beffroi', en: "Belfry Lantern" },
    fragmentIcon: '🏮',
    storyIntro: {
      fr: "Les drones-lutins de Grimnoir tournent autour du beffroi et éteignent ses lanternes. Abats-les vague après vague avant qu'ils ne descendent sur toi.",
      en: "Grimnoir’s elf-drones are circling the belfry and putting out its lanterns. Shoot them down wave after wave before they reach you.",
    },
  },
  {
    day: 5,
    game: 'snake',
    difficulty: 'easy',
    fragmentName: { fr: 'Guirlande enchantée', en: "Enchanted Garland" },
    fragmentIcon: '🎀',
    storyIntro: {
      fr: "Au marché de Noël, une guirlande enchantée ondule entre les étals, affamée. Fais-lui manger au moins 15 pommes pour qu'elle recrache le fragment, puis continue tant qu'elle ne se mord pas la queue !",
      en: "At the Christmas market, a hungry enchanted garland slithers between the stalls. Feed it at least 15 apples so it spits out the shard, then keep going until it bites its own tail!",
    },
  },
  {
    day: 6,
    game: 'dessinconnecte',
    difficulty: 'easy',
    fragmentName: { fr: 'Page du grimoire', en: "Spellbook Page" },
    fragmentIcon: '📜',
    storyIntro: {
      fr: "Dans la cabane du bûcheron, à l'orée de la Forêt Gelée, un grimoire a perdu ses dessins. Relie les points dans l'ordre pour faire réapparaître la page magique.",
      en: "In the woodcutter’s hut, at the edge of the Frozen Forest, a spellbook has lost its drawings. Join the dots in order to bring the magic page back.",
    },
  },
  {
    day: 7,
    game: 'fruitninja',
    difficulty: 'easy',
    fragmentName: { fr: 'Pomme d’argent', en: "Silver Apple" },
    fragmentIcon: '🍎',
    storyIntro: {
      fr: "Un pommier enchanté lance ses fruits gelés dans les airs. Tranche-les d'un geste vif, mais évite les pièges de Grimnoir cachés parmi eux !",
      en: "An enchanted apple tree is throwing its frozen fruit into the air. Slice them with a quick swipe, but avoid Grimnoir’s traps hidden among them!",
    },
  },
  {
    day: 8,
    game: 'memory_sequence',
    difficulty: 'medium',
    fragmentName: { fr: 'Souffle hivernal', en: "Winter Breath" },
    fragmentIcon: '🌬️',
    storyIntro: {
      fr: "Les premiers lutins de Grimnoir sifflent une mélodie de couleurs pour ensorceler la forêt. Retiens la séquence et répète-la pour briser le sort.",
      en: "Grimnoir’s first elves whistle a melody of colours to bewitch the forest. Remember the sequence and repeat it to break the spell.",
    },
  },
  {
    day: 9,
    game: 'bubbleshooter',
    difficulty: 'easy',
    fragmentName: { fr: 'Éclat de bulle', en: "Bubble Shard" },
    fragmentIcon: '🫧',
    storyIntro: {
      fr: "Des bulles de givre ensorcelées se sont accrochées aux branches des sapins. Fais-les éclater par groupes de même couleur pour libérer le fragment.",
      en: "Bewitched frost bubbles are clinging to the fir branches. Pop them in groups of the same colour to free the shard.",
    },
  },
  {
    day: 10,
    game: 'pipepuzzle',
    difficulty: 'medium',
    fragmentName: { fr: 'Sève de cristal', en: "Crystal Sap" },
    fragmentIcon: '💧',
    storyIntro: {
      fr: "La source de la forêt est gelée et la sève ne circule plus. Tourne les tuyaux pour reconnecter la source à l'arbre-mère avant qu'il ne s'endorme.",
      en: "The forest spring is frozen and the sap no longer flows. Rotate the pipes to reconnect the spring to the mother tree before it falls asleep.",
    },
  },
  {
    day: 11,
    game: 'solitaire',
    difficulty: 'medium',
    fragmentName: { fr: 'Carte des cavernes', en: "Cave Map" },
    fragmentIcon: '🃏',
    storyIntro: {
      fr: "À l'entrée des Cavernes de Givre, le fantôme d'un vieux mineur ne laisse passer que ceux qui réussissent sa patience de cartes favorite.",
      en: "At the entrance to the Frost Caves, the ghost of an old miner only lets through those who win his favourite game of patience.",
    },
  },
  {
    day: 12,
    game: 'sudoku',
    difficulty: 'medium',
    gameDifficulty: 'hard',
    fragmentName: { fr: 'Rune des cavernes', en: "Cave Rune" },
    fragmentIcon: '🔷',
    storyIntro: {
      fr: "Au fond d'une galerie, une porte de cristal est gravée d'une grille de chiffres à moitié effacée. Complète-la pour l'ouvrir !",
      en: "Deep in a tunnel, a crystal door is engraved with a half-erased grid of numbers. Complete it to open the door!",
    },
  },
  {
    day: 13,
    game: 'runner',
    difficulty: 'medium',
    fragmentName: { fr: 'Étoile filante', en: "Shooting Star" },
    fragmentIcon: '🌠',
    storyIntro: {
      fr: "Grimnoir s'enfuit à travers les galeries avec un fragment ! Cours sans t'arrêter : saute les obstacles, glisse sous les stalactites et tiens 60 secondes.",
      en: "Grimnoir is fleeing through the tunnels with a shard! Keep running: jump over obstacles, slide under the stalactites and hold on for 60 seconds.",
    },
  },
  {
    day: 14,
    game: 'labyrinthe',
    difficulty: 'medium',
    fragmentName: { fr: 'Boussole de l’explorateur', en: "Explorer’s Compass" },
    fragmentIcon: '🧭',
    storyIntro: {
      fr: "Les galeries forment un labyrinthe où même les chauves-souris se perdent. Trouve la sortie avant que la torche ne s'éteigne.",
      en: "The tunnels form a maze where even bats get lost. Find the way out before the torch goes out.",
    },
  },
  {
    day: 15,
    game: 'nonogram',
    difficulty: 'medium',
    fragmentName: { fr: 'Cristal gravé', en: "Engraved Crystal" },
    fragmentIcon: '💎',
    storyIntro: {
      fr: "Une paroi de cristal cache un dessin secret. Déduis quelles cases noircir grâce aux chiffres des lignes et des colonnes pour le révéler.",
      en: "A crystal wall hides a secret picture. Use the numbers on the rows and columns to work out which squares to fill in and reveal it.",
    },
  },
  {
    day: 16,
    game: 'whackamole',
    difficulty: 'medium',
    fragmentName: { fr: 'Clé des douves', en: "Moat Key" },
    fragmentIcon: '🗝️',
    storyIntro: {
      fr: "Dans les douves gelées de la citadelle, les gobelins de Grimnoir surgissent de partout. Tape-les vite, mais ne touche pas aux faux fragments qui scintillent !",
      en: "In the citadel’s frozen moat, Grimnoir’s goblins pop up everywhere. Hit them fast, but don’t touch the fake shards that sparkle!",
    },
  },
  {
    day: 17,
    game: 'sudoku',
    difficulty: 'hard',
    gameDifficulty: 'very_hard',
    fragmentName: { fr: 'Sceau des remparts', en: "Rampart Seal" },
    fragmentIcon: '🔢',
    storyIntro: {
      fr: "La grande porte de la citadelle est verrouillée par un sceau de chiffres bien plus retors que celui de l'horloge du village. Peu d'indices cette fois : à toi de jouer !",
      en: "The citadel’s great gate is locked by a number seal far trickier than the village clock. Few clues this time: over to you!",
    },
  },
  {
    day: 18,
    game: 'memory_sequence',
    difficulty: 'hard',
    gameDifficulty: 'hard',
    fragmentName: { fr: 'Écho des lutins', en: "Elves’ Echo" },
    fragmentIcon: '🎶',
    storyIntro: {
      fr: "Les lutins de Grimnoir gardent les couloirs de la citadelle et chantent une mélodie de plus en plus longue. Répète-la sans erreur jusqu'au bout pour passer !",
      en: "Grimnoir’s elves guard the citadel’s corridors and sing a melody that keeps getting longer. Repeat it without a mistake to the end to get through!",
    },
  },
  {
    day: 19,
    game: 'dodgeball',
    difficulty: 'hard',
    fragmentName: { fr: 'Bouclier de givre', en: "Frost Shield" },
    fragmentIcon: '🛡️',
    storyIntro: {
      fr: "Du haut de ses remparts, Grimnoir fait pleuvoir boules de neige, comètes et fantômes. Esquive tout jusqu'à la fin du temps pour atteindre le fragment !",
      en: "From the top of his ramparts, Grimnoir rains down snowballs, comets and ghosts. Dodge everything until time runs out to reach the shard!",
    },
  },
  {
    day: 20,
    game: 'cassebriques',
    difficulty: 'hard',
    fragmentName: { fr: 'Éclat du rempart', en: "Rampart Shard" },
    fragmentIcon: '🧊',
    storyIntro: {
      fr: "Le dernier mur de la citadelle est fait de blocs de glace enchantée. Brise-les tous avant la fin du temps, mais méfie-toi des pièges de Grimnoir cachés dans la glace !",
      en: "The citadel’s last wall is made of enchanted ice blocks. Break them all before time runs out, but watch out for Grimnoir’s traps hidden in the ice!",
    },
  },
  {
    day: 21,
    game: 'rythme',
    difficulty: 'hard',
    gameDifficulty: 'medium',
    fragmentName: { fr: 'Cloche du pont', en: "Bridge Bell" },
    fragmentIcon: '🔔',
    storyIntro: {
      fr: "Le pont suspendu ne tient que si ses cloches sonnent en rythme. Suis le Carillon de Noël : tape chaque note quand elle touche la ligne !",
      en: "The rope bridge only holds if its bells ring in time. Follow the Christmas Chime: tap each note as it touches the line!",
    },
  },
  {
    day: 22,
    game: 'marathon_22',
    difficulty: 'very_hard',
    fragmentName: { fr: 'Corde du pont', en: "Bridge Rope" },
    fragmentIcon: '🪢',
    storyIntro: {
      fr: "Au milieu du pont, Grimnoir a déchiré une image de Noël et ensorcelé les friandises du village. Reconstitue l'image, puis aligne les friandises pour briser le sort. Deux épreuves, sans échouer une seule fois !",
      en: "Halfway across the bridge, Grimnoir has torn up a Christmas picture and bewitched the village treats. Rebuild the picture, then match the treats to break the spell. Two trials, without failing a single time!",
    },
  },
  {
    day: 23,
    game: 'marathon_23',
    difficulty: 'very_hard',
    fragmentName: { fr: 'Dernière planche', en: "Last Plank" },
    fragmentIcon: '💠',
    storyIntro: {
      fr: "Au bout du pont, Grimnoir tente un dernier barrage. Fais voler un renne entre ses colonnes de glace, retrouve les paires de son jeu de cartes truqué, puis déchiffre les mots de Noël qu'il a cachés. Trois épreuves, sans droit à l'erreur !",
      en: "At the end of the bridge, Grimnoir tries one last blockade. Fly a reindeer between his ice columns, find the pairs in his rigged card game, then uncover the Christmas words he has hidden. Three trials, no room for error!",
    },
  },
  {
    day: 24,
    game: 'boss',
    difficulty: 'boss',
    fragmentName: { fr: 'Le Cœur de Noël', en: "The Heart of Christmas" },
    fragmentIcon: '❤️‍🔥',
    storyIntro: {
      fr: "Grimnoir t'attend dans la Salle du Cœur. Brise son armure de glace, rassemble les éclats du Cœur jusqu'au sapin 🎄, puis réponds à ses dernières questions. Trois épreuves, aucun hint, aucune erreur permise !",
      en: "Grimnoir awaits you in the Hall of the Heart. Break his ice armour, merge the Heart’s pieces up to the tree 🎄, then answer his final questions. Three trials, no hints, no mistakes allowed!",
    },
  },
];

export function getDayConfig(day: number): DayConfig | undefined {
  return DAYS_CONFIG.find((d) => d.day === day);
}