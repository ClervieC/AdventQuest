export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Quel animal tire traditionnellement le traîneau du Père Noël ?",
    options: ["Cheval", "Renne", "Husky", "Bouc"],
    correctIndex: 1,
  },
  {
    question: "De quelle couleur est traditionnellement le costume du Père Noël ?",
    options: ["Vert", "Bleu", "Rouge", "Doré"],
    correctIndex: 2,
  },
  {
    question: "Quel pays revendique l'origine du sapin de Noël décoré ?",
    options: ["France", "Allemagne", "Italie", "Angleterre"],
    correctIndex: 1,
  },
  {
    question: "Que met-on traditionnellement au sommet du sapin ?",
    options: ["Une couronne", "Une étoile", "Un ange", "Un nœud"],
    correctIndex: 1,
  },
  {
    question: "Quelle boisson chaude est associée aux marchés de Noël ?",
    options: ["Chocolat chaud", "Vin chaud", "Cidre chaud", "Toutes ces réponses"],
    correctIndex: 3,
  },
];