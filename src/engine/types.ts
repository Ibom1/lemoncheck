// Core types shared by the checklist, the engine and the UI.
//
// An inspection holds the car's details and the buyer's answers. It has no
// fields for people: no seller name, phone number, address, VIN or licence
// plate. That is deliberate, see README "Privacy".

export type Rating = 'good' | 'worn' | 'problem' | 'skip';

export type SectionId =
  | 'paperwork'
  | 'exterior'
  | 'tires-brakes'
  | 'engine'
  | 'interior'
  | 'test-drive';

export interface Section {
  id: SectionId;
  title: string;
  intro: string;
}

/** A repair cost range in whole currency units: [low, high]. */
export type CostRange = readonly [number, number];

export interface ChecklistItem {
  id: string;
  section: SectionId;
  label: string;
  /** How to check it, in a sentence or two. */
  help: string;
  /** How much this matters to the car's overall condition, 1 (minor) to 5 (major). */
  weight: 1 | 2 | 3 | 4 | 5;
  /** Typical repair cost when the item is rated worn or problem. */
  cost?: { worn?: CostRange; problem?: CostRange };
  /** A "problem" rating here means the buyer should walk away or get a mechanic first. */
  dealbreaker?: boolean;
  /** Only shown when another item has one of these ratings. */
  showIf?: { item: string; ratings: readonly Rating[] };
}

export type DistanceUnit = 'km' | 'mi';

export interface CarDetails {
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  unit: DistanceUnit;
  askingPrice: number | null;
}

export interface Answer {
  rating: Rating;
  note?: string;
}

export interface Inspection {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  car: CarDetails;
  answers: Record<string, Answer>;
}
