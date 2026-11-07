import { describe, expect, it } from 'vitest';
import { CHECKLIST } from '../data/checklist';
import {
  assess,
  conditionScore,
  mileageCheck,
  rank,
  repairEstimate,
  suggestedOffer,
  summaryText,
  verdict,
} from './assess';
import type { Answer, CarDetails, Inspection, Rating } from './types';

const TODAY = new Date('2026-11-07T12:00:00Z');

const car = (over: Partial<CarDetails> = {}): CarDetails => ({
  make: 'Honda',
  model: 'Civic',
  year: 2018,
  mileage: 150_000,
  unit: 'km',
  askingPrice: 15_000,
  ...over,
});

/** Rate every always-visible item `rating`, with optional overrides. */
function answers(rating: Rating, over: Record<string, Rating> = {}): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const item of CHECKLIST) if (!item.showIf) out[item.id] = { rating };
  for (const [id, r] of Object.entries(over)) out[id] = { rating: r };
  return out;
}

const inspection = (a: Record<string, Answer>, c: CarDetails = car(), id = 'x'): Inspection => ({
  id,
  createdAt: TODAY.toISOString(),
  updatedAt: TODAY.toISOString(),
  car: c,
  answers: a,
});

describe('condition score', () => {
  it('is null with nothing rated, 100 when everything is good', () => {
    expect(conditionScore({ answers: {} })).toBeNull();
    expect(conditionScore({ answers: answers('good') })).toBe(100);
  });

  it('ignores skipped items', () => {
    expect(conditionScore({ answers: { 'clean-title': { rating: 'good' }, glass: { rating: 'skip' } } })).toBe(100);
    expect(conditionScore({ answers: { glass: { rating: 'skip' } } })).toBeNull();
  });

  it('takes more off for problems than for wear, and for heavier items', () => {
    const worn = conditionScore({ answers: answers('good', { 'tire-tread': 'worn' }) })!;
    const problem = conditionScore({ answers: answers('good', { 'tire-tread': 'problem' }) })!;
    const light = conditionScore({ answers: answers('good', { 'tire-match': 'problem' }) })!;
    expect(worn).toBeLessThan(100);
    expect(problem).toBeLessThan(worn);
    expect(light).toBeGreaterThan(problem);
  });

  it('is 0 when everything is a problem', () => {
    expect(conditionScore({ answers: answers('problem') })).toBe(0);
  });
});

describe('verdict', () => {
  const v = (a: Record<string, Answer>, c: CarDetails = car({ askingPrice: null })) => verdict({ answers: a, car: c });

  it('needs enough answers before judging', () => {
    expect(v({ 'clean-title': { rating: 'good' } }).id).toBe('incomplete');
  });

  it('follows the score bands', () => {
    expect(v(answers('good')).id).toBe('good');
    expect(v(answers('worn')).id).toBe('risky');
    expect(v(answers('problem', { 'clean-title': 'good', 'water-damage': 'good', transmission: 'good' })).id).toBe('avoid');
  });

  it('says walk away for any deal-breaker, whatever the score', () => {
    expect(v(answers('good', { 'clean-title': 'problem' })).id).toBe('walk-away');
  });

  it('only counts a deal-breaker follow-up while it is visible', () => {
    const a = answers('good', { 'frame-rust': 'problem' }); // body-rust is "good", so frame-rust is hidden
    expect(v(a).id).toBe('good');
    a['body-rust'] = { rating: 'worn' };
    expect(v(a).id).toBe('walk-away');
  });

  it('caps at "fair" when a major item has a problem, even with a high score', () => {
    const result = v(answers('good', { 'cold-start': 'problem' }));
    expect(conditionScore({ answers: answers('good', { 'cold-start': 'problem' }) })!).toBeGreaterThan(85);
    expect(result.id).toBe('fair');
    expect(result.because!).toContain('major item');
  });

  it('caps by repair cost relative to the asking price', () => {
    // two minor problems: A/C ($500–1,800) and glass ($300–900), middle $1,750
    const a = answers('good', { 'ac-heat': 'problem', glass: 'problem' });
    expect(v(a, car({ askingPrice: 20_000 })).id).toBe('good'); // ~9%
    expect(v(a, car({ askingPrice: 9_000 })).id).toBe('fair'); // ~19%
    const cheap = v(a, car({ askingPrice: 5_000 })); // 35%
    expect(cheap.id).toBe('risky');
    expect(cheap.because!).toContain('35% of the asking price');
  });
});

describe('repair estimate and offer', () => {
  it('adds up cost ranges and counts unpriced issues', () => {
    const est = repairEstimate({
      answers: { 'tire-tread': { rating: 'worn' }, glass: { rating: 'problem' }, 'service-records': { rating: 'problem' } },
    });
    expect(est.low).toBe(300 + 300);
    expect(est.high).toBe(600 + 900);
    expect(est.unpriced).toBe(1);
    expect(est.lines[0].rating).toBe('problem'); // problems listed first
  });

  it('suggests asking price minus the middle estimate, rounded down to 50', () => {
    expect(suggestedOffer(15_000, { low: 600, high: 1500 })).toBe(13_950);
    expect(suggestedOffer(12_340, { low: 0, high: 0 })).toBe(12_300);
    expect(suggestedOffer(500, { low: 1000, high: 3000 })).toBe(0);
    expect(suggestedOffer(null, { low: 100, high: 200 })).toBeNull();
  });
});

describe('mileage check', () => {
  it('flags high and unusually low mileage for the age', () => {
    expect(mileageCheck(car({ year: 2018, mileage: 160_000 }), TODAY)!.status).toBe('normal');
    expect(mileageCheck(car({ year: 2018, mileage: 260_000 }), TODAY)!.status).toBe('high');
    expect(mileageCheck(car({ year: 2018, mileage: 30_000 }), TODAY)!.status).toBe('low');
  });

  it('uses miles for cars measured in miles, and needs a year and mileage', () => {
    expect(mileageCheck(car({ unit: 'mi', mileage: 100_000 }), TODAY)!.status).toBe('normal'); // 8 years x 12,500
    expect(mileageCheck(car({ year: null }), TODAY)).toBeNull();
    expect(mileageCheck(car({ mileage: null }), TODAY)).toBeNull();
  });

  it('treats a brand-new car as one year old', () => {
    expect(mileageCheck(car({ year: 2026, mileage: 15_000 }), TODAY)!.expected).toBe(20_000);
  });
});

describe('comparing cars', () => {
  it('puts deal-breakers last and the cheapest true cost first', () => {
    const cheapButBroken = inspection(answers('good', { transmission: 'problem' }), car({ askingPrice: 9_000 }), 'broken');
    const pricey = inspection(answers('good'), car({ askingPrice: 16_000 }), 'pricey');
    const worn = inspection(answers('good', { 'tire-tread': 'problem', glass: 'problem' }), car({ askingPrice: 14_000 }), 'worn');
    const order = rank([cheapButBroken, pricey, worn], CHECKLIST, TODAY).map((r) => r.inspection.id);
    expect(order).toEqual(['worn', 'pricey', 'broken']); // 14,000 + 1,500 < 16,000
  });
});

describe('assess and summary', () => {
  it('works out the true cost and a readable summary', () => {
    const i = inspection(answers('good', { 'tire-tread': 'worn', 'clean-title': 'problem' }));
    const a = assess(i, CHECKLIST, TODAY);
    expect(a.trueCost).toBe(15_450);
    const text = summaryText(i, CHECKLIST, TODAY);
    expect(text).toContain('2018 Honda Civic: Walk away');
    expect(text).toContain('Deal-breakers:');
    expect(text).toContain('Suggested offer: $14,550');
  });
});
