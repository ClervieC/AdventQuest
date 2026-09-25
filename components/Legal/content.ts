// Textes des Conditions d'utilisation et de la Politique de confidentialité.
// À faire relire idéalement par un juriste avant la publication.

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

const EDITOR = 'Clervie Causer';
const CONTACT = 'clervie@bluedays.com';

export const TERMS: LegalDocument = {
  title: 'Conditions générales d’utilisation',
  updatedAt: '26 septembre 2026',
  sections: [
    {
      title: '1. Objet',
      paragraphs: [
        `AdventQuest est un calendrier de l’Avent interactif proposant un mini-jeu par jour du 1er au 24 décembre, édité par ${EDITOR}. Les présentes conditions encadrent l’utilisation de l’application et du site. En créant un compte, tu les acceptes.`,
      ],
    },
    {
      title: '2. Compte',
      paragraphs: [
        'Un compte se compose d’un pseudo et d’un mot de passe. Aucune adresse e-mail n’est demandée : en cas d’oubli, le mot de passe ne peut pas être récupéré automatiquement.',
        'Tu es responsable de la confidentialité de ton mot de passe et de l’usage de ton compte. Un seul compte par personne.',
        'Le pseudo est visible par les autres joueurs (classement, recherche d’amis). Il doit rester respectueux : pas d’insulte, de contenu choquant, d’usurpation d’identité ni d’information personnelle (nom complet, adresse...).',
      ],
    },
    {
      title: '3. Règles du jeu',
      paragraphs: [
        'Chaque case ne peut être jouée pour de vrai que le jour même ; les jours passés peuvent être rejoués en entraînement, sans effet sur le score. Le jour de chaque joueur est déterminé par le serveur.',
        'Toute tentative de triche (modification de l’application, des échanges avec le serveur, de l’heure ou du fuseau, comptes multiples...) est interdite et peut entraîner la suppression des scores ou du compte.',
      ],
    },
    {
      title: '4. Testeurs',
      paragraphs: [
        'Certains joueurs peuvent recevoir un accès « testeur » pour essayer des jours en avance et envoyer des commentaires. Leurs parties de test comptent dans le classement, où ils sont signalés par 🧪, et peuvent être réinitialisées par l’éditeur (par exemple avant le lancement). Les commentaires envoyés peuvent être utilisés librement pour améliorer le jeu.',
      ],
    },
    {
      title: '5. Modération et suppression',
      paragraphs: [
        'L’éditeur peut suspendre ou supprimer un compte qui ne respecte pas ces conditions, notamment en cas de pseudo inapproprié ou de triche.',
        'Tu peux supprimer ton compte à tout moment depuis l’onglet Profil : toutes tes données de jeu sont alors effacées définitivement.',
      ],
    },
    {
      title: '6. Propriété intellectuelle',
      paragraphs: [
        'Les jeux, textes, illustrations, sons et le nom AdventQuest appartiennent à l’éditeur ou à leurs auteurs. Ils ne peuvent pas être copiés ou réutilisés sans autorisation.',
      ],
    },
    {
      title: '7. Disponibilité et responsabilité',
      paragraphs: [
        'Le service est fourni gratuitement, « en l’état ». L’éditeur fait de son mieux pour qu’il fonctionne correctement mais ne peut garantir une disponibilité permanente ni l’absence d’erreur. Une connexion internet est nécessaire.',
      ],
    },
    {
      title: '8. Modifications',
      paragraphs: [
        'Ces conditions peuvent évoluer. La date de dernière mise à jour figure en haut de cette page.',
      ],
    },
    {
      title: '9. Contact et droit applicable',
      paragraphs: [`Pour toute question : ${CONTACT}. Les présentes conditions sont soumises au droit français.`],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Politique de confidentialité',
  updatedAt: '26 septembre 2026',
  sections: [
    {
      title: '1. Qui est responsable de tes données ?',
      paragraphs: [`Le responsable du traitement est ${EDITOR}. Contact : ${CONTACT}.`],
    },
    {
      title: '2. Les données que nous utilisons',
      paragraphs: [
        '• Ton pseudo et ton mot de passe (stocké uniquement sous forme chiffrée, jamais lisible, même par l’éditeur).',
        '• Une adresse technique générée automatiquement pour la connexion : ce n’est pas ton e-mail, aucun message n’y est envoyé.',
        '• Le fuseau horaire de ton appareil au moment de l’inscription, pour ouvrir chaque case à ton minuit.',
        '• Ta progression : fragments gagnés, scores, nombre d’essais, hints.',
        '• Les joueurs que tu suis.',
        '• Si tu es testeur : les commentaires que tu envoies.',
        '• Des données techniques de connexion (jeton de session).',
        'Nous ne demandons ni nom, ni e-mail, ni numéro de téléphone, ni localisation.',
      ],
    },
    {
      title: '3. Pourquoi ?',
      paragraphs: [
        'Uniquement pour faire fonctionner le jeu : te connecter sur tes appareils, enregistrer ta progression, afficher le classement et les amis, empêcher la triche, et améliorer le jeu grâce aux retours des testeurs. Base légale : l’exécution du service que tu utilises.',
      ],
    },
    {
      title: '4. Qui peut voir quoi ?',
      paragraphs: [
        '• Tous les joueurs voient ton pseudo, ton score total, ton nombre de fragments et ta série dans le classement, et peuvent te trouver par ton pseudo.',
        '• Ta progression détaillée, ton fuseau horaire et la liste des joueurs que tu suis ne sont visibles que par toi.',
        '• Les administrateurs du jeu voient la liste des comptes (pseudo, rôle, score) et les commentaires des testeurs, pour gérer l’application.',
        'Aucune donnée n’est vendue ni utilisée pour de la publicité. L’application ne contient pas de traceur publicitaire.',
      ],
    },
    {
      title: '5. Hébergement',
      paragraphs: [
        'Les données du jeu (comptes, progression, classement, amis, retours) sont stockées par Supabase (base de données et authentification) dans l’Union européenne, région « Central EU » (Francfort, Allemagne).',
        'Le site web est servi par Vercel, qui peut traiter des données techniques de connexion (comme l’adresse IP) le temps de délivrer les pages ; aucune donnée de jeu n’y est stockée.',
      ],
    },
    {
      title: '6. Combien de temps ?',
      paragraphs: [
        'Tant que ton compte existe. Quand tu supprimes ton compte (onglet Profil), ton profil, ta progression, ton classement et tes abonnements sont effacés immédiatement et définitivement. Les commentaires de testeur déjà envoyés sont conservés de façon anonyme.',
      ],
    },
    {
      title: '7. Tes droits',
      paragraphs: [
        'Tu peux accéder à tes données, les rectifier, les supprimer (bouton « Supprimer mon compte »), t’opposer à leur traitement ou demander leur portabilité en écrivant à ' + CONTACT + '. Tu peux aussi introduire une réclamation auprès de la CNIL (cnil.fr).',
      ],
    },
    {
      title: '8. Enfants',
      paragraphs: [
        'AdventQuest peut être utilisé en famille. En France, un enfant de moins de 15 ans doit avoir l’accord d’un parent pour créer un compte. Nous recommandons de choisir un pseudo qui ne permet pas d’identifier l’enfant.',
      ],
    },
    {
      title: '9. Stockage sur l’appareil',
      paragraphs: [
        'L’application garde sur ton appareil ta session de connexion et, si tu joues hors ligne, les parties en attente d’envoi. Il ne s’agit pas de cookies publicitaires.',
      ],
    },
  ],
};

export const MENTIONS: LegalDocument = {
  title: 'Mentions légales',
  updatedAt: '27 septembre 2026',
  sections: [
    {
      title: 'Éditeur',
      paragraphs: [
        `AdventQuest est édité par ${EDITOR}, à titre personnel.`,
        `Contact : ${CONTACT}`,
        `Directrice de la publication : ${EDITOR}.`,
      ],
    },
    {
      title: 'Hébergement du site',
      paragraphs: ['Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis — vercel.com'],
    },
    {
      title: 'Hébergement des données',
      paragraphs: [
        'Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513 — supabase.com',
        'Les données du jeu sont stockées dans l’Union européenne (région « Central EU », Francfort, Allemagne).',
      ],
    },
    {
      title: 'Propriété intellectuelle',
      paragraphs: [
        'Les jeux, textes, illustrations, sons et le nom AdventQuest sont protégés. Toute reproduction sans autorisation est interdite.',
      ],
    },
    {
      title: 'Données personnelles',
      paragraphs: ['Voir la politique de confidentialité, accessible depuis l’écran de connexion et l’onglet Profil.'],
    },
  ],
};
