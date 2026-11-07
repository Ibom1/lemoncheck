import { describe, expect, it } from 'vitest';
import { assess, rank } from '../engine/assess';
import { CHECKLIST } from './checklist';
import { demoInspections, isDemo } from './demo';

const NOW = new Date('2026-11-07T12:00:00Z');

describe('demo cars', () => {
  const cars = demoInspections(NOW);

  it('are marked as demos and only use known checklist items', () => {
    const ids = new Set(CHECKLIST.map((i) => i.id));
    for (const c of cars) {
      expect(isDemo(c)).toBe(true);
      for (const id of Object.keys(c.answers)) expect(ids.has(id)).toBe(true);
    }
  });

  it('show three different outcomes', () => {
    const verdicts = cars.map((c) => assess(c, CHECKLIST, NOW).verdict.id);
    expect(verdicts).toEqual(['fair', 'good', 'walk-away']);
  });

  it('rank the clean car first and the deal-breaker last', () => {
    expect(rank(cars, CHECKLIST, NOW).map((r) => r.inspection.id)).toEqual(['demo-corolla', 'demo-civic', 'demo-focus']);
  });

  it('hold only car details, never people', () => {
    for (const c of cars) expect(Object.keys(c.car).sort()).toEqual(['askingPrice', 'make', 'mileage', 'model', 'unit', 'year']);
  });
});
