/// <reference types="jest" />
import { CHART_CARILLON, CHART_VALSE, getChart } from './charts';
import {
  applyTap,
  Chart,
  comboMultiplier,
  createNoteStates,
  expireMissedNotes,
  findHittableNote,
  GOOD_WINDOW_MS,
  hasPassed,
  isChartFinished,
  judge,
  LANE_COUNT,
  noteProgress,
  PERFECT_WINDOW_MS,
  pointsFor,
  summarize,
} from './logic';

const TEST_CHART: Chart = {
  name: 'Test',
  bpm: 60,
  approachMs: 1000,
  notes: [
    { time: 1000, lane: 0 },
    { time: 2000, lane: 1 },
    { time: 3000, lane: 0 },
    { time: 3000, lane: 3 },
  ],
};

describe('Rythme - jugement des taps', () => {
  test('pile sur la note ou presque : parfait', () => {
    expect(judge(0)).toBe('perfect');
    expect(judge(PERFECT_WINDOW_MS)).toBe('perfect');
    expect(judge(-PERFECT_WINDOW_MS)).toBe('perfect');
  });

  test('un peu en avance ou en retard : bien', () => {
    expect(judge(PERFECT_WINDOW_MS + 1)).toBe('good');
    expect(judge(-GOOD_WINDOW_MS)).toBe('good');
  });

  test('trop loin : ne compte pas', () => {
    expect(judge(GOOD_WINDOW_MS + 1)).toBeNull();
  });

  test('le hint élargit les fenêtres de jugement', () => {
    expect(judge(GOOD_WINDOW_MS + 50)).toBeNull();
    expect(judge(GOOD_WINDOW_MS + 50, 2)).toBe('good');
    expect(judge(PERFECT_WINDOW_MS + 30, 2)).toBe('perfect');
  });
});

describe('Rythme - taps sur les notes', () => {
  test('un tap au bon moment dans le bon couloir touche la note', () => {
    const { states, judgement } = applyTap(createNoteStates(TEST_CHART), 0, 1010);
    expect(judgement).toBe('perfect');
    expect(states[0].result).toBe('perfect');
  });

  test('un tap dans le mauvais couloir ne touche rien', () => {
    const initial = createNoteStates(TEST_CHART);
    const { states, judgement } = applyTap(initial, 2, 1000);
    expect(judgement).toBe('empty');
    expect(states).toBe(initial);
  });

  test('une note déjà jouée ne peut pas être rejouée', () => {
    let states = applyTap(createNoteStates(TEST_CHART), 0, 1000).states;
    const second = applyTap(states, 0, 1020);
    expect(second.judgement).toBe('empty');
    states = second.states;
    expect(summarize(states).perfect).toBe(1);
  });

  test('deux notes simultanées dans 2 couloirs se jouent chacune de leur côté', () => {
    let states = createNoteStates(TEST_CHART);
    states = applyTap(states, 0, 3000).states;
    states = applyTap(states, 3, 3005).states;
    expect(states[2].result).toBe('perfect');
    expect(states[3].result).toBe('perfect');
  });

  test("on cible toujours la plus ancienne note à portée du couloir", () => {
    const states = createNoteStates({ ...TEST_CHART, notes: [{ time: 1000, lane: 0 }, { time: 1100, lane: 0 }] });
    expect(findHittableNote(states, 0, 1050)).toBe(0);
  });
});

describe('Rythme - notes ratées et fin du morceau', () => {
  test('une note dépassée sans tap devient ratée', () => {
    const { states, missed } = expireMissedNotes(createNoteStates(TEST_CHART), 1000 + GOOD_WINDOW_MS + 1);
    expect(missed).toBe(1);
    expect(states[0].result).toBe('miss');
    expect(states[1].result).toBeNull();
  });

  test('rien ne change tant que les notes sont encore jouables', () => {
    const initial = createNoteStates(TEST_CHART);
    const { states, missed } = expireMissedNotes(initial, 1000 + GOOD_WINDOW_MS);
    expect(missed).toBe(0);
    expect(states).toBe(initial);
  });

  test('le morceau est fini quand toutes les notes sont jugées', () => {
    let states = createNoteStates(TEST_CHART);
    expect(isChartFinished(states)).toBe(false);
    states = expireMissedNotes(states, 10000).states;
    expect(isChartFinished(states)).toBe(true);
  });

  test('il faut toucher au moins 70 % des notes pour gagner', () => {
    let states = createNoteStates(TEST_CHART); // 4 notes
    states = applyTap(states, 0, 1000).states;
    states = applyTap(states, 1, 2000).states;
    states = applyTap(states, 0, 3000).states;
    states = expireMissedNotes(states, 10000).states; // 3/4 = 75 %
    expect(summarize(states).accuracy).toBe(0.75);
    expect(hasPassed(states)).toBe(true);

    let failed = applyTap(createNoteStates(TEST_CHART), 0, 1000).states;
    failed = applyTap(failed, 1, 2000).states;
    failed = expireMissedNotes(failed, 10000).states; // 2/4 = 50 %
    expect(hasPassed(failed)).toBe(false);
  });
});

describe('Rythme - score', () => {
  test('parfait vaut plus que bien, raté ne rapporte rien', () => {
    expect(pointsFor('perfect', 0)).toBe(100);
    expect(pointsFor('good', 0)).toBe(50);
    expect(pointsFor('miss', 0)).toBe(0);
  });

  test('le combo multiplie les points, plafonné à ×4', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(9)).toBe(1);
    expect(comboMultiplier(10)).toBe(2);
    expect(comboMultiplier(25)).toBe(3);
    expect(comboMultiplier(100)).toBe(4);
    expect(pointsFor('perfect', 30)).toBe(400);
  });
});

describe('Rythme - affichage des notes', () => {
  test('une note apparaît en haut puis atteint la ligne à son temps', () => {
    expect(noteProgress(2000, 1000, 1000)).toBe(0);
    expect(noteProgress(2000, 1500, 1000)).toBe(0.5);
    expect(noteProgress(2000, 2000, 1000)).toBe(1);
  });

  test("une note trop lointaine ou déjà passée n'est pas affichée", () => {
    expect(noteProgress(3000, 1000, 1000)).toBeNull();
    expect(noteProgress(1000, 1500, 1000)).toBeNull();
  });
});

describe('Rythme - partitions jouables', () => {
  test.each([CHART_CARILLON, CHART_VALSE].map((c) => [c.name, c] as const))('« %s »', (_name, chart) => {
    expect(chart.notes.length).toBeGreaterThanOrEqual(30);
    chart.notes.forEach((n) => {
      expect(n.lane).toBeGreaterThanOrEqual(0);
      expect(n.lane).toBeLessThan(LANE_COUNT);
      // La première note laisse le temps de la voir descendre
      expect(n.time).toBeGreaterThanOrEqual(chart.approachMs);
    });
    // Triées dans l'ordre du temps
    for (let i = 1; i < chart.notes.length; i++) expect(chart.notes[i].time).toBeGreaterThanOrEqual(chart.notes[i - 1].time);
    // Jamais plus de 2 notes en même temps (jouable avec deux pouces)
    const byTime = new Map<number, number>();
    chart.notes.forEach((n) => byTime.set(n.time, (byTime.get(n.time) ?? 0) + 1));
    expect(Math.max(...byTime.values())).toBeLessThanOrEqual(2);
    // Dans un même couloir, deux notes ne sont jamais à portée du même tap
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const times = chart.notes.filter((n) => n.lane === lane).map((n) => n.time);
      for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThan(GOOD_WINDOW_MS * 2);
    }
  });

  test('facile/moyen = Carillon, difficile = Valse', () => {
    expect(getChart('easy')).toBe(CHART_CARILLON);
    expect(getChart('medium')).toBe(CHART_CARILLON);
    expect(getChart('hard')).toBe(CHART_VALSE);
    expect(getChart('very_hard')).toBe(CHART_VALSE);
  });
});
