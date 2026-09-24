export type GameType = 'quiz' | 'stack' | 'sudoku' | 'snake' | 'memory_sequence' | 'whackamole' | 'solitaire' | 'bubbleshooter' | 'labyrinthe' | 'pipepuzzle' | 'spaceinvaders' | 'dessinconnecte' | 'fruitninja' | 'nonogram' | 'runner' | 'dodgeball' | 'cassebriques' | 'marathon_22' | 'marathon_23' | 'boss' | 'rythme';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'boss';


// La zone d'un jour se déduit de son numéro : voir getZoneForDay dans constants/zones.ts
export interface DayConfig {
  day: number;
  game: GameType;
  difficulty: Difficulty;
  fragmentName: string;
  fragmentIcon: string;
  storyIntro: string;
  gameDifficulty?: 'easy' | 'medium' | 'hard' | 'very_hard';
}


export const DAYS_CONFIG: DayConfig[] = [
  {
    day: 1,
    game: 'quiz',
    difficulty: 'easy',
    fragmentName: 'Éclat de lumière',
    fragmentIcon: '✦',
    storyIntro: "Au centre du village figé, une vieille statue gardienne s'anime. Avant de te confier le premier fragment, elle veut vérifier que tu connais bien Noël : 10 questions tirées au hasard, 6 bonnes réponses au moins.",
  },
  {
    day: 2,
    game: 'stack',
    difficulty: 'easy',
    fragmentName: 'Graine de givre',
    fragmentIcon: '❄️',
    storyIntro: "La fontaine de la place est gelée en couches épaisses. Empile les blocs de glace bien droit pour atteindre le fragment coincé tout en haut.",
  },
  {
    day: 3,
    game: 'sudoku',
    difficulty: 'easy',
    fragmentName: 'Cristal des heures',
    fragmentIcon: '🕰️',
    storyIntro: "L'horloge magique de la mairie s'est arrêtée à minuit sur une grille de chiffres. Remplis-la pour relancer le temps du village.",
  },
  {
    day: 4,
    game: 'spaceinvaders',
    difficulty: 'medium',
    fragmentName: 'Lanterne du beffroi',
    fragmentIcon: '🏮',
    storyIntro: "Les drones-lutins de Grimnoir tournent autour du beffroi et éteignent ses lanternes. Abats-les vague après vague avant qu'ils ne descendent sur toi.",
  },
  {
    day: 5,
    game: 'snake',
    difficulty: 'easy',
    fragmentName: 'Guirlande enchantée',
    fragmentIcon: '🎀',
    storyIntro: "Au marché de Noël, une guirlande enchantée ondule entre les étals, affamée. Guide-la vers les pommes pendant 45 secondes pour qu'elle recrache le fragment.",
  },
  {
    day: 6,
    game: 'dessinconnecte',
    difficulty: 'easy',
    fragmentName: 'Page du grimoire',
    fragmentIcon: '📜',
    storyIntro: "Dans la cabane du bûcheron, à l'orée de la Forêt Gelée, un grimoire a perdu ses dessins. Relie les points dans l'ordre pour faire réapparaître la page magique.",
  },
  {
    day: 7,
    game: 'fruitninja',
    difficulty: 'easy',
    fragmentName: 'Pomme d’argent',
    fragmentIcon: '🍎',
    storyIntro: "Un pommier enchanté lance ses fruits gelés dans les airs. Tranche-les d'un geste vif, mais évite les pièges de Grimnoir cachés parmi eux !",
  },
  {
    day: 8,
    game: 'memory_sequence',
    difficulty: 'easy',
    fragmentName: 'Souffle hivernal',
    fragmentIcon: '🌬️',
    storyIntro: "Les premiers lutins de Grimnoir sifflent une mélodie de couleurs pour ensorceler la forêt. Retiens la séquence et répète-la pour briser le sort.",
  },
  {
    day: 9,
    game: 'bubbleshooter',
    difficulty: 'easy',
    fragmentName: 'Éclat de bulle',
    fragmentIcon: '🫧',
    storyIntro: "Des bulles de givre ensorcelées se sont accrochées aux branches des sapins. Fais-les éclater par groupes de même couleur pour libérer le fragment.",
  },
  {
    day: 10,
    game: 'pipepuzzle',
    difficulty: 'medium',
    fragmentName: 'Sève de cristal',
    fragmentIcon: '💧',
    storyIntro: "La source de la forêt est gelée et la sève ne circule plus. Tourne les tuyaux pour reconnecter la source à l'arbre-mère avant qu'il ne s'endorme.",
  },
  {
    day: 11,
    game: 'solitaire',
    difficulty: 'medium',
    fragmentName: 'Carte des cavernes',
    fragmentIcon: '🃏',
    storyIntro: "À l'entrée des Cavernes de Givre, le fantôme d'un vieux mineur ne laisse passer que ceux qui réussissent sa patience de cartes favorite.",
  },
  {
    day: 12,
    game: 'sudoku',
    difficulty: 'medium',
    gameDifficulty: 'medium',
    fragmentName: 'Rune des cavernes',
    fragmentIcon: '🔷',
    storyIntro: "Au fond d'une galerie, une porte de cristal est gravée d'une grille de chiffres à moitié effacée. Complète-la pour l'ouvrir !",
  },
  {
    day: 13,
    game: 'runner',
    difficulty: 'medium',
    fragmentName: 'Étoile filante',
    fragmentIcon: '🌠',
    storyIntro: "Grimnoir s'enfuit à travers les galeries avec un fragment ! Cours sans t'arrêter : saute les obstacles, glisse sous les stalactites et tiens 60 secondes.",
  },
  {
    day: 14,
    game: 'labyrinthe',
    difficulty: 'medium',
    fragmentName: 'Boussole de l’explorateur',
    fragmentIcon: '🧭',
    storyIntro: "Les galeries forment un labyrinthe où même les chauves-souris se perdent. Trouve la sortie avant que la torche ne s'éteigne.",
  },
  {
    day: 15,
    game: 'nonogram',
    difficulty: 'medium',
    fragmentName: 'Cristal gravé',
    fragmentIcon: '💎',
    storyIntro: "Une paroi de cristal cache un dessin secret. Déduis quelles cases noircir grâce aux chiffres des lignes et des colonnes pour le révéler.",
  },
  {
    day: 16,
    game: 'whackamole',
    difficulty: 'medium',
    fragmentName: 'Clé des douves',
    fragmentIcon: '🗝️',
    storyIntro: "Dans les douves gelées de la citadelle, les gobelins de Grimnoir surgissent de partout. Tape-les vite, mais ne touche pas aux faux fragments qui scintillent !",
  },
  {
    day: 17,
    game: 'sudoku',
    difficulty: 'hard',
    gameDifficulty: 'hard',
    fragmentName: 'Sceau des remparts',
    fragmentIcon: '🔢',
    storyIntro: "La grande porte de la citadelle est verrouillée par un sceau de chiffres bien plus retors que celui de l'horloge du village. Peu d'indices cette fois : à toi de jouer !",
  },
  {
    day: 18,
    game: 'memory_sequence',
    difficulty: 'hard',
    gameDifficulty: 'hard',
    fragmentName: 'Écho des lutins',
    fragmentIcon: '🎶',
    storyIntro: "Les lutins de Grimnoir gardent les couloirs de la citadelle et chantent une mélodie de plus en plus longue. Répète-la sans erreur jusqu'au bout pour passer !",
  },
  {
    day: 19,
    game: 'dodgeball',
    difficulty: 'hard',
    fragmentName: 'Bouclier de givre',
    fragmentIcon: '🛡️',
    storyIntro: "Du haut de ses remparts, Grimnoir fait pleuvoir boules de neige, comètes et fantômes. Esquive tout jusqu'à la fin du temps pour atteindre le fragment !",
  },
  {
    day: 20,
    game: 'cassebriques',
    difficulty: 'hard',
    fragmentName: 'Éclat du rempart',
    fragmentIcon: '🧊',
    storyIntro: "Le dernier mur de la citadelle est fait de blocs de glace enchantée. Brise-les tous avant la fin du temps, mais méfie-toi des pièges de Grimnoir cachés dans la glace !",
  },
  {
    day: 21,
    game: 'rythme',
    difficulty: 'hard',
    gameDifficulty: 'hard',
    fragmentName: 'Cloche du pont',
    fragmentIcon: '🔔',
    storyIntro: "Le pont suspendu ne tient que si ses cloches sonnent en rythme. Suis la Valse des flocons : tape chaque note quand elle touche la ligne !",
  },
  {
    day: 22,
    game: 'marathon_22',
    difficulty: 'very_hard',
    fragmentName: 'Corde du pont',
    fragmentIcon: '🪢',
    storyIntro: "Au milieu du pont, deux épreuves t'attendent. Repousse les envahisseurs, puis fais éclater les bulles de givre, sans échouer une seule fois !",
  },
  {
    day: 23,
    game: 'marathon_23',
    difficulty: 'very_hard',
    fragmentName: 'Dernière planche',
    fragmentIcon: '💠',
    storyIntro: "Au bout du pont, Grimnoir tente un dernier barrage. Esquive sa pluie de projectiles, puis garde ton sang-froid pour révéler le sapin caché dans la grille magique !",
  },
  {
    day: 24,
    game: 'boss',
    difficulty: 'boss',
    fragmentName: 'Le Cœur de Noël',
    fragmentIcon: '❤️‍🔥',
    storyIntro: "Grimnoir t'attend dans la Salle du Cœur. Reconstruis la tour du Cœur, brise son armure de glace, puis réponds à ses dernières questions. Trois épreuves, aucun hint, aucune erreur permise !",
  },
];

export function getDayConfig(day: number): DayConfig | undefined {
  return DAYS_CONFIG.find((d) => d.day === day);
}