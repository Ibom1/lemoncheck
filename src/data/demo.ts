import { CHECKLIST } from './checklist';
import type { Answer, CarDetails, Inspection, Rating } from '../engine/types';

// Sample inspections for the "Try a demo" button and the README screenshot.
// Every detail is made up. They show the three outcomes worth seeing: a car to
// negotiate on, a clean car, and a car with a deal-breaker.

export const DEMO_PREFIX = 'demo-';

export function isDemo(inspection: Pick<Inspection, 'id'>): boolean {
  return inspection.id.startsWith(DEMO_PREFIX);
}

/** Every always-visible item rated good, plus the given ratings and notes. */
function answers(over: Record<string, Rating | [Rating, string]>): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  for (const item of CHECKLIST) if (!item.showIf) out[item.id] = { rating: 'good' };
  for (const [id, value] of Object.entries(over)) {
    out[id] = Array.isArray(value) ? { rating: value[0], note: value[1] } : { rating: value };
  }
  return out;
}

function demo(id: string, car: CarDetails, a: Record<string, Answer>, daysAgo: number, now: Date): Inspection {
  const when = new Date(now.getTime() - daysAgo * 86_400_000).toISOString();
  return { id: DEMO_PREFIX + id, createdAt: when, updatedAt: when, car, answers: a };
}

export function demoInspections(now = new Date()): Inspection[] {
  const year = now.getFullYear();
  return [
    demo(
      'civic',
      { make: 'Honda', model: 'Civic', year: year - 8, mileage: 148_000, unit: 'km', askingPrice: 15_500 },
      answers({
        'body-rust': ['worn', 'Bubbling paint on the rear left wheel arch'],
        'frame-rust': 'good',
        'tire-tread': ['worn', 'About 3 mm left on the fronts'],
        glass: ['problem', 'Crack across the passenger side of the windshield'],
        'exhaust-smoke': 'worn',
        'smoke-blue': 'good',
        'smoke-white': 'good',
        'ac-heat': ['problem', 'A/C blows warm after five minutes'],
      }),
      0,
      now,
    ),
    demo(
      'corolla',
      { make: 'Toyota', model: 'Corolla', year: year - 6, mileage: 96_000, unit: 'km', askingPrice: 17_900 },
      answers({
        'tire-match': 'worn',
        battery: ['worn', 'Battery dated five years ago'],
        'open-recalls': 'skip',
      }),
      1,
      now,
    ),
    demo(
      'focus',
      { make: 'Ford', model: 'Focus', year: year - 9, mileage: 171_000, unit: 'km', askingPrice: 9_800 },
      answers({
        'service-records': 'problem',
        'tire-wear': ['worn', 'Inside edges worn on both fronts'],
        transmission: ['problem', 'Shudders pulling away; revs flare between 2nd and 3rd'],
        suspension: 'worn',
      }),
      2,
      now,
    ),
  ];
}
