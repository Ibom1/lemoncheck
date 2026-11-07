import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, loadInspections, newInspection, saveInspections } from './storage';
import type { CarDetails } from './types';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    raw: data,
  };
}

const car: CarDetails = { make: 'Mazda', model: '3', year: 2017, mileage: 120_000, unit: 'km', askingPrice: 11_000 };

describe('storage', () => {
  it('round-trips inspections', () => {
    const store = memoryStore();
    const i = newInspection(car, new Date('2026-11-07T12:00:00Z'));
    i.answers['glass'] = { rating: 'worn', note: 'chip on passenger side' };
    expect(saveInspections([i], store)).toBe(true);
    expect(loadInspections(store)).toEqual([i]);
  });

  it('returns an empty list for missing, broken or unknown-version data', () => {
    const store = memoryStore();
    expect(loadInspections(store)).toEqual([]);
    store.setItem(STORAGE_KEY, '{not json');
    expect(loadInspections(store)).toEqual([]);
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 99, inspections: [] }));
    expect(loadInspections(store)).toEqual([]);
  });

  it('drops unknown fields and bad ratings from saved data', () => {
    const store = memoryStore();
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        inspections: [
          {
            id: 'a',
            car: { ...car, sellerPhone: '555-0100', year: 'old' },
            answers: { glass: { rating: 'good' }, lights: { rating: 'excellent' } },
          },
          { nonsense: true },
        ],
      }),
    );
    const [only, ...rest] = loadInspections(store);
    expect(rest).toEqual([]);
    expect(only.car).toEqual({ ...car, year: null });
    expect(Object.keys(only.answers)).toEqual(['glass']);
  });

  it('never throws when the browser blocks storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(loadInspections(blocked)).toEqual([]);
    expect(saveInspections([], blocked)).toBe(false);
    expect(loadInspections(undefined)).toEqual([]);
  });
});
