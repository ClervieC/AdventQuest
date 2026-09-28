// Mise en page sur grand écran (ordi) : l'appli (fond, barres de défilement, onglets) prend toute la largeur,
// mais le contenu de chaque page est centré et limité à la largeur des 5 jours du calendrier.
// Sur téléphone, plus étroit, le contenu prend simplement toute la largeur disponible.
export const WIDE_BREAKPOINT = 700;
export const WIDE_CELL_SIZE = 110;
export const WIDE_CELL_GAP = 12;
export const CALENDAR_PADDING = 12;
/** Largeur des 5 cases d'une zone du calendrier : la largeur de référence du contenu */
export const CONTENT_WIDTH = WIDE_CELL_SIZE * 5 + WIDE_CELL_GAP * 4; // 598 px
export const APP_MAX_WIDTH = CONTENT_WIDTH + CALENDAR_PADDING * 2; // 622 px

/**
 * Colonne de contenu centrée, avec sa marge intérieure : le contenu fait au plus CONTENT_WIDTH,
 * aligné sur les cases du calendrier. À mettre dans le contentContainerStyle des listes et défilements,
 * pour que la barre de défilement reste au bord de l'écran.
 */
export function pageColumn(padding: number) {
  return {
    width: '100%',
    maxWidth: CONTENT_WIDTH + padding * 2,
    alignSelf: 'center',
    paddingHorizontal: padding,
  } as const;
}

/** Colonne centrée sans marge intérieure (le conteneur gère déjà la sienne) */
export const contentColumn = {
  width: '100%',
  maxWidth: APP_MAX_WIDTH,
  alignSelf: 'center',
} as const;
