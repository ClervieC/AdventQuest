/// <reference types="jest" />
import { buildRecap, dayEmoji, recapShareText } from './recap';

const days = {
  1: { fragmentWon: true, bestScore: 1800, attempts: 1 },
  2: { fragmentWon: true, bestScore: 2600, attempts: 3 },
  3: { fragmentWon: false, bestScore: 0, attempts: 7 },
  5: { fragmentWon: true, bestScore: 2000, attempts: 1 },
};

describe('Récap de la saison', () => {
  test('case du jour : premier coup, plusieurs essais, raté, pas joué', () => {
    expect(dayEmoji({ fragmentWon: true, bestScore: 1, attempts: 1 })).toBe('🟩');
    expect(dayEmoji({ fragmentWon: true, bestScore: 1, attempts: 4 })).toBe('🟨');
    expect(dayEmoji({ fragmentWon: false, bestScore: 0, attempts: 2 })).toBe('🟥');
    expect(dayEmoji(undefined)).toBe('⬛');
  });

  test('totaux, meilleurs jeux et jeu le plus rejoué', () => {
    const recap = buildRecap(days);
    expect(recap.fragments).toBe(3);
    expect(recap.totalPoints).toBe(6400);
    expect(recap.daysPlayed).toBe(4);
    expect(recap.wonFirstTry).toBe(2);
    expect(recap.best.map((d) => d.day)).toEqual([2, 5, 1]);
    expect(recap.toughest?.day).toBe(3); // 7 essais
  });

  test('grille de 24 cases sur 4 rangées', () => {
    const rows = buildRecap(days).grid.split('\n');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toBe('🟩🟨🟥⬛🟩⬛');
  });

  test('texte à partager dans les deux langues', () => {
    const recap = buildRecap(days);
    const fr = recapShareText(recap, { lang: 'fr', locale: 'fr-FR', rank: 1, url: 'https://exemple.fr' });
    expect(fr).toContain('3/24 fragments');
    expect(fr).toContain('🏆 1er');
    expect(fr).toContain('💪 Mon défi :');
    expect(fr).toContain('https://exemple.fr');
    const en = recapShareText(recap, { lang: 'en', locale: 'en-GB', rank: 12, url: null });
    expect(en).toContain('3/24 shards');
    expect(en).toContain('#12');
    expect(en).toContain('My best game:');
  });
});
