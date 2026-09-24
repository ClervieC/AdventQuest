// Les 6 zones de l'aventure : la zone d'un jour se déduit de son numéro (plus de texte recopié jour par jour)
export type ZoneId = 'village' | 'forest' | 'caves' | 'citadel' | 'bridge' | 'heart';

export interface Zone {
  id: ZoneId;
  name: string;
  icon: string;
  firstDay: number;
  lastDay: number;
  banner: string; // texte narratif affiché quand le joueur arrive dans la zone
}

export const ZONES: Zone[] = [
  {
    id: 'village',
    name: 'Le Village Englouti',
    icon: '🎄',
    firstDay: 1,
    lastDay: 5,
    banner:
      "La nuit où Grimnoir a brisé le Cœur de Noël, le village s'est figé sous la glace. Les habitants attendent, immobiles, que le Gardien des Fêtes rallume les premières lumières.",
  },
  {
    id: 'forest',
    name: 'La Forêt Gelée',
    icon: '🌲',
    firstDay: 6,
    lastDay: 10,
    banner:
      "Au-delà des dernières maisons, la forêt s'est couverte de givre. Les lutins de Grimnoir y rôdent et ont caché des fragments jusque dans les arbres.",
  },
  {
    id: 'caves',
    name: 'Les Cavernes de Givre',
    icon: '💎',
    firstDay: 11,
    lastDay: 15,
    banner:
      "Sous la montagne, les fragments sont prisonniers du cristal. Il faudra de la patience et de la logique pour les sortir des Cavernes de Givre.",
  },
  {
    id: 'citadel',
    name: 'La Citadelle de Grimnoir',
    icon: '🏰',
    firstDay: 16,
    lastDay: 20,
    banner:
      "La forteresse de Grimnoir se dresse au sommet de la montagne. Ses remparts sont bien gardés : les épreuves y deviennent redoutables.",
  },
  {
    id: 'bridge',
    name: 'Le Pont Suspendu',
    icon: '🌉',
    firstDay: 21,
    lastDay: 23,
    banner:
      "Un pont fragile au-dessus du vide mène à la Salle du Cœur. Chaque planche se mérite : ici, les épreuves s'enchaînent sans droit à l'erreur.",
  },
  {
    id: 'heart',
    name: 'La Salle du Cœur',
    icon: '💖',
    firstDay: 24,
    lastDay: 24,
    banner:
      "Grimnoir t'attend au pied du Cœur de Noël brisé. Seul un Gardien qui a réuni au moins 12 fragments pourra franchir le portail et l'affronter.",
  },
];

export function getZoneForDay(day: number): Zone {
  return ZONES.find((zone) => day >= zone.firstDay && day <= zone.lastDay) ?? ZONES[ZONES.length - 1];
}
