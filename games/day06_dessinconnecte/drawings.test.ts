/// <reference types="jest" />
import { ALL_DRAWINGS } from './drawings';

describe.each(ALL_DRAWINGS.map((d) => [d.name, d] as const))('Dessin « %s »', (_name, drawing) => {
  test('au moins 20 points, numérotés 1, 2, 3... dans l’ordre', () => {
    expect(drawing.points.length).toBeGreaterThanOrEqual(20);
    drawing.points.forEach((p, i) => expect(p.id).toBe(i + 1));
  });

  test('tous les points dans la zone de dessin', () => {
    drawing.points.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(4);
      expect(p.x).toBeLessThanOrEqual(96);
      expect(p.y).toBeGreaterThanOrEqual(4);
      expect(p.y).toBeLessThanOrEqual(96);
    });
  });

  test('deux points ne se chevauchent jamais (numéros lisibles)', () => {
    drawing.points.forEach((a, i) =>
      drawing.points.slice(i + 1).forEach((b) => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(7))
    );
  });
});
