import type { Localized } from '../services/i18n';

// Les 6 zones de l'aventure : la zone d'un jour se déduit de son numéro (plus de texte recopié jour par jour)
export type ZoneId = 'village' | 'forest' | 'caves' | 'citadel' | 'bridge' | 'heart';

export interface Zone {
  id: ZoneId;
  name: Localized;
  icon: string;
  firstDay: number;
  lastDay: number;
  banner: Localized; // texte narratif affiché quand le joueur arrive dans la zone
}

export const ZONES: Zone[] = [
  {
    id: 'village',
    name: { fr: 'Le Village Englouti', en: 'The Sunken Village' },
    icon: '🎄',
    firstDay: 1,
    lastDay: 5,
    banner: {
      fr: "La nuit où Grimnoir a brisé le Cœur de Noël, le village s'est figé sous la glace. Les habitants attendent, immobiles, que le Gardien des Fêtes rallume les premières lumières.",
      en: "The night Grimnoir shattered the Heart of Christmas, the village froze under the ice. The villagers wait, motionless, for the Keeper of the Holidays to relight the first lights.",
    },
  },
  {
    id: 'forest',
    name: { fr: 'La Forêt Gelée', en: 'The Frozen Forest' },
    icon: '🌲',
    firstDay: 6,
    lastDay: 10,
    banner: {
      fr: "Au-delà des dernières maisons, la forêt s'est couverte de givre. Les lutins de Grimnoir y rôdent et ont caché des fragments jusque dans les arbres.",
      en: "Beyond the last houses, the forest is covered in frost. Grimnoir’s elves prowl there and have hidden shards even in the trees.",
    },
  },
  {
    id: 'caves',
    name: { fr: 'Les Cavernes de Givre', en: 'The Frost Caves' },
    icon: '💎',
    firstDay: 11,
    lastDay: 15,
    banner: {
      fr: "Sous la montagne, les fragments sont prisonniers du cristal. Il faudra de la patience et de la logique pour les sortir des Cavernes de Givre.",
      en: "Under the mountain, the shards are trapped in crystal. It will take patience and logic to get them out of the Frost Caves.",
    },
  },
  {
    id: 'citadel',
    name: { fr: 'La Citadelle de Grimnoir', en: 'Grimnoir’s Citadel' },
    icon: '🏰',
    firstDay: 16,
    lastDay: 20,
    banner: {
      fr: "La forteresse de Grimnoir se dresse au sommet de la montagne. Ses remparts sont bien gardés : les épreuves y deviennent redoutables.",
      en: "Grimnoir’s fortress stands at the top of the mountain. Its ramparts are well guarded: the trials here become fearsome.",
    },
  },
  {
    id: 'bridge',
    name: { fr: 'Le Pont Suspendu', en: 'The Rope Bridge' },
    icon: '🌉',
    firstDay: 21,
    lastDay: 23,
    banner: {
      fr: "Un pont fragile au-dessus du vide mène à la Salle du Cœur. Chaque planche se mérite : ici, les épreuves s'enchaînent sans droit à l'erreur.",
      en: "A fragile bridge over the void leads to the Hall of the Heart. Every plank must be earned: here, the trials follow one another with no room for error.",
    },
  },
  {
    id: 'heart',
    name: { fr: 'La Salle du Cœur', en: 'The Hall of the Heart' },
    icon: '💖',
    firstDay: 24,
    lastDay: 24,
    banner: {
      fr: "Grimnoir t'attend au pied du Cœur de Noël brisé. Seul un Gardien qui a réuni au moins 12 fragments pourra franchir le portail et l'affronter.",
      en: "Grimnoir awaits you at the foot of the shattered Heart of Christmas. Only a Keeper who has gathered at least 12 shards can pass through the portal and face him.",
    },
  },
];

export function getZoneForDay(day: number): Zone {
  return ZONES.find((zone) => day >= zone.firstDay && day <= zone.lastDay) ?? ZONES[ZONES.length - 1];
}
