import { CHECKLIST } from '../data/checklist';
import { activeAnswers, progress } from './checklist';
import type { CarDetails, ChecklistItem, CostRange, Inspection, Rating } from './types';

/** How much of an item's weight a rating takes off the score. */
const PENALTY: Record<Rating, number> = { good: 0, worn: 0.4, problem: 1, skip: 0 };

export type VerdictId = 'good' | 'fair' | 'risky' | 'avoid' | 'walk-away' | 'incomplete';

export interface Verdict {
  id: VerdictId;
  title: string;
  advice: string;
  /** Set when the verdict is worse than the score alone suggests, saying why. */
  because?: string;
}

const VERDICTS: Record<VerdictId, Verdict> = {
  good: { id: 'good', title: 'Good buy', advice: 'Minor issues only. Use them to round the price down.' },
  fair: { id: 'fair', title: 'Fair, negotiate', advice: 'Some wear to fix soon. Make an offer that covers the repairs.' },
  risky: { id: 'risky', title: 'Risky', advice: 'Several real problems. Only buy after a mechanic inspects it, and at a lower price.' },
  avoid: { id: 'avoid', title: 'Avoid', advice: 'Too many problems for the money. Keep looking.' },
  'walk-away': {
    id: 'walk-away',
    title: 'Walk away',
    advice: 'A deal-breaker was found. Do not buy unless a mechanic says the problem is minor.',
  },
  incomplete: { id: 'incomplete', title: 'Not enough checked', advice: 'Rate at least 10 items to get a verdict.' },
};

export const MIN_ANSWERS_FOR_VERDICT = 10;

/**
 * Condition score from 0 to 100, or null when nothing has been rated.
 * Only rated items count; "skip" means "couldn't check" and is ignored.
 */
export function conditionScore(inspection: Pick<Inspection, 'answers'>, checklist = CHECKLIST): number | null {
  const rated = activeAnswers(inspection.answers, checklist).filter((a) => a.answer.rating !== 'skip');
  const max = rated.reduce((n, a) => n + a.item.weight, 0);
  if (max === 0) return null;
  const lost = rated.reduce((n, a) => n + a.item.weight * PENALTY[a.answer.rating], 0);
  return Math.round(100 * (1 - lost / max));
}

export function dealbreakers(inspection: Pick<Inspection, 'answers'>, checklist = CHECKLIST): ChecklistItem[] {
  return activeAnswers(inspection.answers, checklist)
    .filter((a) => a.item.dealbreaker && a.answer.rating === 'problem')
    .map((a) => a.item);
}

const BANDS: VerdictId[] = ['good', 'fair', 'risky', 'avoid']; // best to worst

/** Repairs above these shares of the asking price cap the verdict. */
export const REPAIR_SHARE_CAPS = { fair: 0.15, risky: 0.3 } as const;
/** A "problem" on an item at least this heavy caps the verdict at "fair". */
export const MAJOR_WEIGHT = 3;

/**
 * The verdict starts from the score band, then is capped by what the score can
 * hide: a single major problem, or repairs that are large next to the price.
 * Averaging 30+ items would otherwise let a few expensive faults look minor.
 */
export function verdict(inspection: Pick<Inspection, 'answers' | 'car'>, checklist = CHECKLIST): Verdict {
  if (dealbreakers(inspection, checklist).length) return VERDICTS['walk-away'];
  const active = activeAnswers(inspection.answers, checklist);
  const rated = active.filter((a) => a.answer.rating !== 'skip');
  const score = conditionScore(inspection, checklist);
  if (score === null || rated.length < MIN_ANSWERS_FOR_VERDICT) return VERDICTS.incomplete;

  let band: VerdictId = score >= 85 ? 'good' : score >= 70 ? 'fair' : score >= 50 ? 'risky' : 'avoid';
  let because: string | undefined;
  const capAt = (worst: VerdictId, reason: string) => {
    if (BANDS.indexOf(band) < BANDS.indexOf(worst)) {
      band = worst;
      because = reason;
    }
  };

  const major = active.filter((a) => a.answer.rating === 'problem' && a.item.weight >= MAJOR_WEIGHT);
  if (major.length) capAt('fair', `A major item has a problem: ${major[0].item.label.toLowerCase()}.`);

  const asking = inspection.car.askingPrice;
  if (asking) {
    const est = repairEstimate(inspection, checklist);
    const share = (est.low + est.high) / 2 / asking;
    const pct = `${Math.round(share * 100)}%`;
    if (share > REPAIR_SHARE_CAPS.risky) capAt('risky', `Repairs are about ${pct} of the asking price.`);
    else if (share > REPAIR_SHARE_CAPS.fair) capAt('fair', `Repairs are about ${pct} of the asking price.`);
  }
  return because ? { ...VERDICTS[band], because } : VERDICTS[band];
}

export interface RepairLine {
  item: ChecklistItem;
  rating: 'worn' | 'problem';
  cost: CostRange | null; // null when the cost can't be estimated
}

export interface RepairEstimate {
  lines: RepairLine[];
  low: number;
  high: number;
  /** Number of issues with no cost estimate (deal-breakers, paperwork). */
  unpriced: number;
}

export function repairEstimate(inspection: Pick<Inspection, 'answers'>, checklist = CHECKLIST): RepairEstimate {
  const lines: RepairLine[] = [];
  for (const { item, answer } of activeAnswers(inspection.answers, checklist)) {
    if (answer.rating !== 'worn' && answer.rating !== 'problem') continue;
    lines.push({ item, rating: answer.rating, cost: item.cost?.[answer.rating] ?? null });
  }
  // Most serious first: problems before wear, then by weight, then by cost.
  lines.sort(
    (a, b) =>
      Number(b.rating === 'problem') - Number(a.rating === 'problem') ||
      b.item.weight - a.item.weight ||
      (b.cost?.[1] ?? 0) - (a.cost?.[1] ?? 0),
  );
  return {
    lines,
    low: lines.reduce((n, l) => n + (l.cost?.[0] ?? 0), 0),
    high: lines.reduce((n, l) => n + (l.cost?.[1] ?? 0), 0),
    unpriced: lines.filter((l) => l.cost === null).length,
  };
}

/**
 * A suggested opening offer: the asking price minus the middle of the repair
 * estimate, rounded down to the nearest 50. Null without an asking price.
 */
export function suggestedOffer(askingPrice: number | null, estimate: Pick<RepairEstimate, 'low' | 'high'>): number | null {
  if (askingPrice === null || askingPrice <= 0) return null;
  const mid = (estimate.low + estimate.high) / 2;
  return Math.max(0, Math.floor((askingPrice - mid) / 50) * 50);
}

/** Typical distance driven per year, used to judge whether the odometer looks plausible. */
export const TYPICAL_PER_YEAR = { km: 20_000, mi: 12_500 } as const;

export interface MileageCheck {
  status: 'high' | 'low' | 'normal';
  expected: number;
  message: string;
}

export function mileageCheck(car: CarDetails, today = new Date()): MileageCheck | null {
  if (car.year === null || car.mileage === null) return null;
  const age = Math.max(1, today.getFullYear() - car.year);
  const expected = age * TYPICAL_PER_YEAR[car.unit];
  const fmt = (n: number) => `${Math.round(n).toLocaleString('en-CA')} ${car.unit}`;
  if (car.mileage > expected * 1.3) {
    return {
      status: 'high',
      expected,
      message: `High for a ${age}-year-old car (typical: about ${fmt(expected)}). Expect wear on suspension, brakes and the transmission.`,
    };
  }
  if (car.mileage < expected * 0.4) {
    return {
      status: 'low',
      expected,
      message: `Unusually low for its age (typical: about ${fmt(expected)}). Ask for service records that confirm it.`,
    };
  }
  return { status: 'normal', expected, message: `Normal for its age (typical: about ${fmt(expected)}).` };
}

export interface Assessment {
  score: number | null;
  verdict: Verdict;
  dealbreakers: ChecklistItem[];
  repairs: RepairEstimate;
  offer: number | null;
  mileage: MileageCheck | null;
  answered: number;
  total: number;
  /** Asking price plus the middle of the repair estimate: what the car really costs. */
  trueCost: number | null;
}

export function assess(inspection: Inspection, checklist = CHECKLIST, today = new Date()): Assessment {
  const repairs = repairEstimate(inspection, checklist);
  const p = progress(inspection.answers, checklist);
  const asking = inspection.car.askingPrice;
  return {
    score: conditionScore(inspection, checklist),
    verdict: verdict(inspection, checklist),
    dealbreakers: dealbreakers(inspection, checklist),
    repairs,
    offer: suggestedOffer(asking, repairs),
    mileage: mileageCheck(inspection.car, today),
    answered: p.answered,
    total: p.total,
    trueCost: asking !== null ? Math.round(asking + (repairs.low + repairs.high) / 2) : null,
  };
}

/**
 * Rank inspections for comparison: cars with deal-breakers last, then by
 * true cost (cheapest first) when known, then by score (best first).
 */
export function rank(inspections: Inspection[], checklist = CHECKLIST, today = new Date()) {
  return inspections
    .map((inspection) => ({ inspection, assessment: assess(inspection, checklist, today) }))
    .sort((a, b) => {
      const da = a.assessment.dealbreakers.length > 0 ? 1 : 0;
      const db = b.assessment.dealbreakers.length > 0 ? 1 : 0;
      if (da !== db) return da - db;
      const ca = a.assessment.trueCost ?? Infinity;
      const cb = b.assessment.trueCost ?? Infinity;
      if (ca !== cb) return ca - cb;
      return (b.assessment.score ?? -1) - (a.assessment.score ?? -1);
    });
}

export function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}

export function carName(car: CarDetails): string {
  return [car.year, car.make, car.model].filter(Boolean).join(' ') || 'Unnamed car';
}

/** A plain-text summary to paste into a message or notes app. */
export function summaryText(inspection: Inspection, checklist = CHECKLIST, today = new Date()): string {
  const a = assess(inspection, checklist, today);
  const lines = [
    `${carName(inspection.car)}: ${a.verdict.title}${a.score !== null ? ` (${a.score}/100)` : ''}`,
    `Checked ${a.answered} of ${a.total} items.`,
  ];
  if (inspection.car.askingPrice !== null) lines.push(`Asking: ${money(inspection.car.askingPrice)}`);
  if (a.dealbreakers.length) {
    lines.push('', 'Deal-breakers:', ...a.dealbreakers.map((d) => `- ${d.label}`));
  }
  if (a.repairs.lines.length) {
    lines.push('', `Issues (est. ${money(a.repairs.low)}–${money(a.repairs.high)}):`);
    for (const l of a.repairs.lines) {
      const cost = l.cost ? ` ${money(l.cost[0])}–${money(l.cost[1])}` : '';
      lines.push(`- [${l.rating}] ${l.item.label}${cost}`);
    }
  }
  if (a.offer !== null && a.repairs.lines.length) lines.push('', `Suggested offer: ${money(a.offer)}`);
  if (a.mileage) lines.push('', `Mileage: ${a.mileage.message}`);
  return lines.join('\n');
}
