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
  updatedAt: '28 septembre 2026',
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
        '• Si tu réponds au sondage de fin de saison (facultatif) : ta note, tes jeux préférés, tes envies et tes commentaires pour l’année prochaine.',
        '• Des données techniques de connexion (jeton de session).',
        'Nous ne demandons ni nom, ni e-mail, ni numéro de téléphone, ni localisation.',
      ],
    },
    {
      title: '3. Pourquoi ?',
      paragraphs: [
        'Uniquement pour faire fonctionner le jeu : te connecter sur tes appareils, enregistrer ta progression, afficher le classement et les amis, empêcher la triche, et améliorer le jeu grâce aux retours des testeurs et au sondage de fin de saison. Base légale : l’exécution du service que tu utilises.',
      ],
    },
    {
      title: '4. Qui peut voir quoi ?',
      paragraphs: [
        '• Tous les joueurs voient ton pseudo, ton score total, ton nombre de fragments et ta série dans le classement, et peuvent te trouver par ton pseudo.',
        '• Ta progression détaillée, ton fuseau horaire et la liste des joueurs que tu suis ne sont visibles que par toi.',
        '• Les administrateurs du jeu voient la liste des comptes (pseudo, rôle, score) et les commentaires des testeurs et les réponses au sondage de fin de saison, pour gérer et améliorer l’application.',
        'Aucune donnée n’est vendue ni utilisée pour de la publicité. L’application ne contient pas de traceur publicitaire.',
      ],
    },
    {
      title: '5. Hébergement',
      paragraphs: [
        'Les données du jeu (comptes, progression, classement, amis, retours, sondage) sont stockées par Supabase (base de données et authentification) dans l’Union européenne, région « Central EU » (Francfort, Allemagne).',
        'Le site web est servi par Vercel, qui peut traiter des données techniques de connexion (comme l’adresse IP) le temps de délivrer les pages ; aucune donnée de jeu n’y est stockée.',
      ],
    },
    {
      title: '6. Combien de temps ?',
      paragraphs: [
        'Tant que ton compte existe. Quand tu supprimes ton compte (onglet Profil), ton profil, ta progression, ton classement, tes abonnements et ta réponse au sondage sont effacés immédiatement et définitivement. Les commentaires de testeur déjà envoyés sont conservés de façon anonyme.',
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

// ---------- Version anglaise (traduction : la version française fait foi) ----------

const TRANSLATION_NOTE: LegalSection = {
  title: 'Translation',
  paragraphs: ['This is a translation provided for convenience. In case of any difference, the French version prevails.'],
};

export const TERMS_EN: LegalDocument = {
  title: 'Terms of use',
  updatedAt: '26 September 2026',
  sections: [
    {
      title: '1. Purpose',
      paragraphs: [
        `AdventQuest is an interactive Advent calendar offering one mini-game a day from 1 to 24 December, published by ${EDITOR}. These terms govern the use of the app and the website. By creating an account, you accept them.`,
      ],
    },
    {
      title: '2. Account',
      paragraphs: [
        'An account consists of a username and a password. No email address is required: if you forget your password, it cannot be recovered automatically.',
        'You are responsible for keeping your password confidential and for the use of your account. One account per person.',
        'Your username is visible to other players (leaderboard, friend search). It must remain respectful: no insults, shocking content, impersonation or personal information (full name, address...).',
      ],
    },
    {
      title: '3. Game rules',
      paragraphs: [
        'Each day can only be played for real on that day; past days can be replayed as practice, with no effect on the score. Each player’s day is determined by the server.',
        'Any attempt to cheat (modifying the app, the exchanges with the server, the time or time zone, multiple accounts...) is forbidden and may lead to scores or the account being deleted.',
      ],
    },
    {
      title: '4. Testers',
      paragraphs: [
        'Some players may be given “tester” access to try days in advance and send comments. Their test games count in the leaderboard, where they are marked with 🧪, and may be reset by the publisher (for example before launch). Comments sent may be used freely to improve the game.',
      ],
    },
    {
      title: '5. Moderation and deletion',
      paragraphs: [
        'The publisher may suspend or delete an account that does not comply with these terms, in particular in case of an inappropriate username or cheating.',
        'You can delete your account at any time from the Profile tab: all your game data is then permanently erased.',
      ],
    },
    {
      title: '6. Intellectual property',
      paragraphs: [
        'The games, texts, illustrations, sounds and the AdventQuest name belong to the publisher or their authors. They may not be copied or reused without permission.',
      ],
    },
    {
      title: '7. Availability and liability',
      paragraphs: [
        'The service is provided free of charge, “as is”. The publisher does their best to keep it working properly but cannot guarantee permanent availability or the absence of errors. An internet connection is required.',
      ],
    },
    {
      title: '8. Changes',
      paragraphs: ['These terms may change. The date of the last update is shown at the top of this page.'],
    },
    {
      title: '9. Contact and governing law',
      paragraphs: [`For any question: ${CONTACT}. These terms are governed by French law.`],
    },
    TRANSLATION_NOTE,
  ],
};

export const PRIVACY_EN: LegalDocument = {
  title: 'Privacy policy',
  updatedAt: '28 September 2026',
  sections: [
    {
      title: '1. Who is responsible for your data?',
      paragraphs: [`The data controller is ${EDITOR}. Contact: ${CONTACT}.`],
    },
    {
      title: '2. The data we use',
      paragraphs: [
        '• Your username and password (stored only in encrypted form, never readable, not even by the publisher).',
        '• A technical address generated automatically for signing in: it is not your email, and no message is ever sent to it.',
        '• Your device’s time zone when you sign up, so that each day opens at your midnight.',
        '• Your progress: shards won, scores, number of attempts, hints.',
        '• The players you follow.',
        '• If you are a tester: the comments you send.',
        '• If you answer the end-of-season survey (optional): your rating, your favourite games, your wishes and your comments for next year.',
        '• Technical connection data (session token).',
        'We never ask for your name, email, phone number or location.',
      ],
    },
    {
      title: '3. Why?',
      paragraphs: [
        'Only to run the game: sign you in on your devices, save your progress, show the leaderboard and friends, prevent cheating, and improve the game thanks to testers’ feedback and the end-of-season survey. Legal basis: performance of the service you use.',
      ],
    },
    {
      title: '4. Who can see what?',
      paragraphs: [
        '• All players can see your username, total score, number of shards and streak in the leaderboard, and can find you by your username.',
        '• Your detailed progress, your time zone and the list of players you follow are visible only to you.',
        '• The game’s administrators can see the list of accounts (username, role, score), testers’ comments and answers to the end-of-season survey, to manage and improve the app.',
        'No data is sold or used for advertising. The app contains no advertising trackers.',
      ],
    },
    {
      title: '5. Hosting',
      paragraphs: [
        'Game data (accounts, progress, leaderboard, friends, feedback, survey) is stored by Supabase (database and authentication) in the European Union, “Central EU” region (Frankfurt, Germany).',
        'The website is served by Vercel, which may process technical connection data (such as your IP address) while delivering the pages; no game data is stored there.',
      ],
    },
    {
      title: '6. How long?',
      paragraphs: [
        'As long as your account exists. When you delete your account (Profile tab), your profile, progress, leaderboard entry, follows and survey answer are erased immediately and permanently. Tester comments already sent are kept anonymously.',
      ],
    },
    {
      title: '7. Your rights',
      paragraphs: [
        'You can access, correct or delete your data (“Delete my account” button), object to its processing or ask for its portability by writing to ' + CONTACT + '. You can also lodge a complaint with the CNIL, the French data protection authority (cnil.fr).',
      ],
    },
    {
      title: '8. Children',
      paragraphs: [
        'AdventQuest can be enjoyed as a family. In France, a child under 15 needs a parent’s consent to create an account. We recommend choosing a username that does not identify the child.',
      ],
    },
    {
      title: '9. Storage on your device',
      paragraphs: [
        'The app keeps your login session on your device and, if you play offline, the games waiting to be sent. These are not advertising cookies.',
      ],
    },
    TRANSLATION_NOTE,
  ],
};

export const MENTIONS_EN: LegalDocument = {
  title: 'Legal notice',
  updatedAt: '27 September 2026',
  sections: [
    {
      title: 'Publisher',
      paragraphs: [
        `AdventQuest is published by ${EDITOR}, as a private individual.`,
        `Contact: ${CONTACT}`,
        `Publication director: ${EDITOR}.`,
      ],
    },
    {
      title: 'Website hosting',
      paragraphs: ['Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States — vercel.com'],
    },
    {
      title: 'Data hosting',
      paragraphs: [
        'Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513 — supabase.com',
        'Game data is stored in the European Union (“Central EU” region, Frankfurt, Germany).',
      ],
    },
    {
      title: 'Intellectual property',
      paragraphs: [
        'The games, texts, illustrations, sounds and the AdventQuest name are protected. Any reproduction without permission is forbidden.',
      ],
    },
    {
      title: 'Personal data',
      paragraphs: ['See the privacy policy, available from the login screen and the Profile tab.'],
    },
    TRANSLATION_NOTE,
  ],
};
