import type { Answer, CarDetails, Inspection, Rating } from './types';

// Inspections are saved in the browser's localStorage, on this device only.
// Nothing is sent anywhere. Reads are defensive: storage can be unavailable
// (private browsing) or hold data from an older or newer version.

export const STORAGE_KEY = 'lemoncheck:v1';
const VERSION = 1;

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

interface SavedFile {
  version: number;
  inspections: Inspection[];
}

const RATINGS: readonly Rating[] = ['good', 'worn', 'problem', 'skip'];

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

function str(v: unknown, max = 60): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

/** Rebuild an inspection from untrusted JSON, keeping only known fields. */
function clean(raw: unknown): Inspection | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.car || typeof r.car !== 'object') return null;
  const c = r.car as Record<string, unknown>;
  const car: CarDetails = {
    make: str(c.make),
    model: str(c.model),
    year: num(c.year),
    mileage: num(c.mileage),
    unit: c.unit === 'mi' ? 'mi' : 'km',
    askingPrice: num(c.askingPrice),
  };
  const answers: Record<string, Answer> = {};
  if (r.answers && typeof r.answers === 'object') {
    for (const [id, a] of Object.entries(r.answers as Record<string, unknown>)) {
      const ans = a as Record<string, unknown> | null;
      if (!ans || !RATINGS.includes(ans.rating as Rating)) continue;
      answers[id] = { rating: ans.rating as Rating, ...(ans.note ? { note: str(ans.note, 500) } : {}) };
    }
  }
  const now = new Date().toISOString();
  return {
    id: r.id,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
    car,
    answers,
  };
}

export function loadInspections(store: KeyValueStore | undefined = safeLocalStorage()): Inspection[] {
  if (!store) return [];
  let text: string | null;
  try {
    text = store.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!text) return [];
  try {
    const data = JSON.parse(text) as Partial<SavedFile>;
    if (data.version !== VERSION || !Array.isArray(data.inspections)) return [];
    return data.inspections.map(clean).filter((i): i is Inspection => i !== null);
  } catch {
    return [];
  }
}

/** Returns false when the browser refused to save (full or blocked storage). */
export function saveInspections(inspections: Inspection[], store: KeyValueStore | undefined = safeLocalStorage()): boolean {
  if (!store) return false;
  try {
    const file: SavedFile = { version: VERSION, inspections };
    store.setItem(STORAGE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

function safeLocalStorage(): KeyValueStore | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function newInspection(car: CarDetails, now = new Date()): Inspection {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const iso = now.toISOString();
  return { id, createdAt: iso, updatedAt: iso, car, answers: {} };
}
