export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// On écrit chaque question avec sa bonne réponse à part : la position de la bonne réponse
// est ensuite répartie automatiquement (A, B, C, D à tour de rôle) pour qu'elle ne soit pas devinable.
interface RawQuestion {
  question: string;
  answer: string;
  wrong: [string, string, string];
}

const RAW_QUESTIONS: RawQuestion[] = [
  // --- Père Noël & traditions
  { question: 'Quel animal tire traditionnellement le traîneau du Père Noël ?', answer: 'Le renne', wrong: ['Le cheval', 'Le husky', 'Le bouc'] },
  { question: 'Comment s’appelle le renne au nez rouge ?', answer: 'Rudolph', wrong: ['Comète', 'Tornade', 'Éclair'] },
  { question: 'Combien de rennes tirent le traîneau dans la tradition, sans compter Rudolph ?', answer: '8', wrong: ['4', '6', '12'] },
  { question: 'De quelle couleur est traditionnellement le costume du Père Noël ?', answer: 'Rouge', wrong: ['Vert', 'Bleu', 'Doré'] },
  { question: 'Par où le Père Noël entre-t-il dans les maisons, selon la tradition ?', answer: 'La cheminée', wrong: ['La fenêtre', 'La cave', 'Le garage'] },
  { question: 'Qui aide le Père Noël à fabriquer les jouets ?', answer: 'Les lutins', wrong: ['Les fées', 'Les trolls', 'Les nains de jardin'] },
  { question: 'Dans quel pays se trouve Rovaniemi, surnommée « le village du Père Noël » ?', answer: 'La Finlande', wrong: ['La Norvège', 'Le Canada', 'L’Islande'] },
  { question: 'Dans quelle ville se trouve le secrétariat du Père Noël de La Poste, qui répond aux lettres des enfants ?', answer: 'Libourne', wrong: ['Strasbourg', 'Lyon', 'Lille'] },
  { question: 'Qu’accroche-t-on à la cheminée pour recevoir des petits cadeaux ?', answer: 'Une chaussette', wrong: ['Un gant', 'Un bonnet', 'Une écharpe'] },

  // --- Saints et personnages
  { question: 'À quelle date fête-t-on la Saint-Nicolas ?', answer: 'Le 6 décembre', wrong: ['Le 1er décembre', 'Le 13 décembre', 'Le 24 décembre'] },
  { question: 'Qui accompagne saint Nicolas pour punir les enfants pas sages ?', answer: 'Le Père Fouettard', wrong: ['Le Père Grognon', 'Le Croque-mitaine', 'Le Marchand de sable'] },
  { question: 'Saint Nicolas était évêque de Myre, une ville située dans l’actuelle…', answer: 'Turquie', wrong: ['Italie', 'Grèce', 'Espagne'] },
  { question: 'Aux Pays-Bas, comment appelle-t-on saint Nicolas ?', answer: 'Sinterklaas', wrong: ['Julenissen', 'Weihnachtsmann', 'Babbo Natale'] },
  { question: 'En Italie, quelle gentille sorcière apporte des cadeaux le 6 janvier ?', answer: 'La Befana', wrong: ['La Strega', 'La Fata', 'La Nonna'] },
  { question: 'Combien de rois mages rendent visite à l’enfant Jésus dans la tradition ?', answer: '3', wrong: ['2', '4', '7'] },
  { question: 'Lequel de ces noms n’est PAS celui d’un roi mage ?', answer: 'Barnabé', wrong: ['Melchior', 'Gaspard', 'Balthazar'] },
  { question: 'Quels animaux entourent l’enfant Jésus dans la crèche traditionnelle ?', answer: 'Le bœuf et l’âne', wrong: ['Le cheval et le chien', 'La vache et le mouton', 'Le chameau et la chèvre'] },
  { question: 'Comment appelle-t-on les petites figurines de crèche en Provence ?', answer: 'Les santons', wrong: ['Les poupons', 'Les bibelots', 'Les marionnettes'] },

  // --- Calendrier
  { question: 'Quel jour commence traditionnellement le calendrier de l’Avent ?', answer: 'Le 1er décembre', wrong: ['Le 25 novembre', 'Le 6 décembre', 'Le 15 décembre'] },
  { question: 'Combien de bougies compte une couronne de l’Avent ?', answer: '4', wrong: ['3', '5', '7'] },
  { question: 'Comment s’appelle le grand repas de fête du soir du 24 décembre ?', answer: 'Le réveillon', wrong: ['Le goûter', 'Le banquet des rois', 'Le brunch'] },
  { question: 'Quelle fête du 6 janvier célèbre la visite des rois mages ?', answer: 'L’Épiphanie', wrong: ['La Chandeleur', 'L’Ascension', 'La Toussaint'] },
  { question: 'Que cache-t-on dans la galette des rois ?', answer: 'Une fève', wrong: ['Une pièce', 'Une amande', 'Une bague'] },
  { question: 'Autour de quelle date a lieu le solstice d’hiver, le jour le plus court de l’année dans l’hémisphère nord ?', answer: 'Le 21 décembre', wrong: ['Le 1er décembre', 'Le 25 décembre', 'Le 1er janvier'] },
  { question: 'En Australie, Noël tombe en quelle saison ?', answer: 'En été', wrong: ['En hiver', 'Au printemps', 'En automne'] },

  // --- Sapin & plantes
  { question: 'Que place-t-on traditionnellement au sommet du sapin ?', answer: 'Une étoile', wrong: ['Une chaussette', 'Un nœud', 'Une cloche'] },
  { question: 'Dans quelle ville d’Alsace trouve-t-on l’une des plus anciennes mentions écrites d’un sapin de Noël, en 1521 ?', answer: 'Sélestat', wrong: ['Colmar', 'Mulhouse', 'Metz'] },
  { question: 'Pourquoi le sapin reste-t-il vert en hiver ?', answer: 'Il garde ses aiguilles', wrong: ['On le peint', 'Il pousse sous la neige', 'Il fleurit en décembre'] },
  { question: 'Sous quelle plante à baies blanches a-t-on coutume de s’embrasser au Nouvel An ?', answer: 'Le gui', wrong: ['Le houx', 'Le lierre', 'Le laurier'] },
  { question: 'Quelle plante aux feuilles piquantes et aux baies rouges décore les tables de Noël ?', answer: 'Le houx', wrong: ['Le gui', 'Le buis', 'Le romarin'] },
  { question: 'De quel pays est originaire le poinsettia, la plante rouge surnommée « étoile de Noël » ?', answer: 'Le Mexique', wrong: ['La Chine', 'Le Brésil', 'L’Inde'] },
  { question: 'Quelles sont les deux couleurs traditionnelles de Noël ?', answer: 'Rouge et vert', wrong: ['Bleu et jaune', 'Rose et violet', 'Orange et noir'] },

  // --- Gourmandises
  { question: 'Quel dessert de Noël a la forme d’un morceau de bois ?', answer: 'La bûche', wrong: ['La tarte Tatin', 'Le clafoutis', 'Le mille-feuille'] },
  { question: 'Dans quelle région sert-on traditionnellement les 13 desserts de Noël ?', answer: 'La Provence', wrong: ['La Bretagne', 'L’Alsace', 'La Normandie'] },
  { question: 'Quel gâteau de Noël aux fruits confits vient de Milan, en Italie ?', answer: 'Le panettone', wrong: ['Le tiramisu', 'La panna cotta', 'Le cannolo'] },
  { question: 'De quel pays vient le stollen, un pain brioché de Noël ?', answer: 'L’Allemagne', wrong: ['La Suède', 'L’Espagne', 'Le Portugal'] },
  { question: 'Quel pays mange traditionnellement le « Christmas pudding » ?', answer: 'Le Royaume-Uni', wrong: ['Les États-Unis', 'La Belgique', 'Le Canada'] },
  { question: 'Quelle ville française est réputée pour son pain d’épices ?', answer: 'Dijon', wrong: ['Brest', 'Nice', 'Bordeaux'] },
  { question: 'Quel chocolat de fin d’année est emballé avec une petite blague ?', answer: 'La papillote', wrong: ['La truffe', 'Le rocher', 'La crotte en chocolat'] },
  { question: 'Comment appelle-t-on les petits biscuits de Noël alsaciens ?', answer: 'Les bredele', wrong: ['Les madeleines', 'Les palets', 'Les calissons'] },
  { question: 'Quelle friandise en forme de canne a des rayures rouges et blanches ?', answer: 'Le sucre d’orge', wrong: ['La guimauve', 'Le nougat', 'La réglisse'] },
  { question: 'Quelle ville française accueille l’un des plus anciens marchés de Noël, le Christkindelsmärik ?', answer: 'Strasbourg', wrong: ['Paris', 'Lyon', 'Toulouse'] },

  // --- Chansons, livres & films
  { question: 'Quel chanteur a rendu célèbre « Petit Papa Noël » ?', answer: 'Tino Rossi', wrong: ['Charles Aznavour', 'Johnny Hallyday', 'Georges Brassens'] },
  { question: 'Dans quel pays a été composé « Douce nuit » (Stille Nacht) en 1818 ?', answer: 'L’Autriche', wrong: ['La France', 'L’Angleterre', 'La Suisse'] },
  { question: 'De quelle chanson américaine « Vive le vent » est-elle l’adaptation ?', answer: 'Jingle Bells', wrong: ['White Christmas', 'Let It Snow', 'Silent Night'] },
  { question: 'Complète : « Mon beau sapin, roi des… »', answer: 'forêts', wrong: ['montagnes', 'jardins', 'neiges'] },
  { question: 'Complète : « Il est né le divin enfant, jouez hautbois, résonnez… »', answer: 'musettes', wrong: ['trompettes', 'clochettes', 'guitares'] },
  { question: 'Qui a composé la musique du ballet « Casse-Noisette » ?', answer: 'Tchaïkovski', wrong: ['Mozart', 'Beethoven', 'Vivaldi'] },
  { question: 'Qui a écrit le conte « Un chant de Noël », avec l’avare Ebenezer Scrooge ?', answer: 'Charles Dickens', wrong: ['Victor Hugo', 'Jules Verne', 'Hans Christian Andersen'] },
  { question: 'De quelle couleur est le Grinch ?', answer: 'Vert', wrong: ['Rouge', 'Bleu', 'Violet'] },
  { question: 'Dans « Maman, j’ai raté l’avion », comment s’appelle le garçon oublié à la maison ?', answer: 'Kevin', wrong: ['Tom', 'Max', 'Charlie'] },
  { question: 'Comment s’appelle le bonhomme de neige de « La Reine des neiges » ?', answer: 'Olaf', wrong: ['Sven', 'Kristoff', 'Hans'] },

  // --- Hiver & langues
  { question: 'Combien de branches possède un flocon de neige ?', answer: '6', wrong: ['4', '5', '8'] },
  { question: 'Avec quel légume fait-on traditionnellement le nez du bonhomme de neige ?', answer: 'Une carotte', wrong: ['Un radis', 'Un poireau', 'Une pomme de terre'] },
  { question: 'Où vit l’ours polaire ?', answer: 'En Arctique', wrong: ['En Antarctique', 'En Amazonie', 'Au Sahara'] },
  { question: 'Où vivent les manchots empereurs ?', answer: 'En Antarctique', wrong: ['En Arctique', 'En Laponie', 'Au Groenland'] },
  { question: 'Comment dit-on « Joyeux Noël » en espagnol ?', answer: 'Feliz Navidad', wrong: ['Buon Natale', 'Frohe Weihnachten', 'Merry Christmas'] },
  { question: 'Comment dit-on « Joyeux Noël » en allemand ?', answer: 'Frohe Weihnachten', wrong: ['Feliz Navidad', 'Buon Natale', 'God Jul'] },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = RAW_QUESTIONS.map((raw, index) => {
  const correctIndex = index % 4;
  const options = [...raw.wrong];
  options.splice(correctIndex, 0, raw.answer);
  return { question: raw.question, options, correctIndex };
});

export const QUESTIONS_PER_GAME = 10;

/** Tire `count` questions différentes au hasard (une nouvelle sélection à chaque partie) */
export function pickQuizQuestions(count: number = QUESTIONS_PER_GAME, pool: QuizQuestion[] = QUIZ_QUESTIONS): QuizQuestion[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
