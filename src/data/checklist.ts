import type { ChecklistItem, Section } from '../engine/types';

// The inspection checklist.
//
// Costs are rough parts-and-labour ranges for an average car at an independent
// shop. They exist to size a problem and anchor a negotiation, not to quote a
// repair. The roadmap adds per-region and per-car adjustments.

export const SECTIONS: readonly Section[] = [
  {
    id: 'paperwork',
    title: 'Paperwork',
    intro: 'Check the history before you look at the car. A bad title ends the visit early.',
  },
  {
    id: 'exterior',
    title: 'Exterior',
    intro: 'Walk around the car in daylight. Crouch down and look along each side.',
  },
  {
    id: 'tires-brakes',
    title: 'Tires & brakes',
    intro: 'Tires show how the car was driven and whether it is aligned.',
  },
  {
    id: 'engine',
    title: 'Under the hood',
    intro: 'Ask for the engine to be cold when you arrive. A warm engine can hide start-up problems.',
  },
  {
    id: 'interior',
    title: 'Interior & electronics',
    intro: 'Sit in every seat and press every button.',
  },
  {
    id: 'test-drive',
    title: 'Test drive',
    intro: 'Drive at least 20 minutes, with city streets, a highway and a hard (safe) stop.',
  },
];

export const CHECKLIST: readonly ChecklistItem[] = [
  // ---------- paperwork ----------
  {
    id: 'clean-title',
    section: 'paperwork',
    label: 'Title is clean (not salvage, rebuilt or flood)',
    help: 'Read the ownership document itself, not a photo of it. A branded title hurts resale and insurance.',
    weight: 5,
    dealbreaker: true,
  },
  {
    id: 'history-report',
    section: 'paperwork',
    label: 'History report shows no major accidents',
    help: 'Run a vehicle history report before you visit. Minor damage is common; frame or airbag damage is not.',
    weight: 4,
    cost: { worn: [0, 500], problem: [1500, 5000] },
  },
  {
    id: 'service-records',
    section: 'paperwork',
    label: 'Service records are available',
    help: 'Regular oil changes on record are a good sign. No records at all means more risk.',
    weight: 3,
  },
  {
    id: 'open-recalls',
    section: 'paperwork',
    label: 'No open safety recalls',
    help: "Check the manufacturer's recall lookup. Recall repairs are free at a dealer, but you should know before buying.",
    weight: 2,
  },

  // ---------- exterior ----------
  {
    id: 'body-rust',
    section: 'exterior',
    label: 'Body is free of rust',
    help: 'Look at wheel arches, door bottoms, rocker panels and around the trunk seal. Bubbling paint is rust underneath.',
    weight: 4,
    cost: { worn: [300, 900], problem: [1200, 3500] },
  },
  {
    id: 'frame-rust',
    section: 'exterior',
    label: 'Frame and underbody are solid',
    help: 'Look under the car with a flashlight. Surface rust is normal; flaking, holes or soft metal are not.',
    weight: 5,
    dealbreaker: true,
    cost: { worn: [400, 1200] },
    showIf: { item: 'body-rust', ratings: ['worn', 'problem'] },
  },
  {
    id: 'panel-gaps',
    section: 'exterior',
    label: 'Panel gaps are even all around',
    help: 'The gaps between doors, hood and fenders should be the same width on both sides.',
    weight: 3,
    cost: { problem: [500, 2000] },
  },
  {
    id: 'paint-match',
    section: 'exterior',
    label: 'Paint colour matches on every panel, no overspray',
    help: 'Mismatched panels or paint on rubber seals mean past body work. Ask what happened.',
    weight: 3,
    cost: { worn: [200, 600], problem: [800, 2500] },
    showIf: { item: 'panel-gaps', ratings: ['worn', 'problem'] },
  },
  {
    id: 'glass',
    section: 'exterior',
    label: 'Windshield and windows have no cracks or chips',
    help: 'Chips in the driver\'s view tend to spread into cracks.',
    weight: 2,
    cost: { worn: [80, 150], problem: [300, 900] },
  },
  {
    id: 'lights',
    section: 'exterior',
    label: 'All lights work and lenses are clear',
    help: 'Have someone check headlights, high beams, brake lights, signals and reverse lights.',
    weight: 2,
    cost: { worn: [50, 150], problem: [150, 600] },
  },

  // ---------- tires & brakes ----------
  {
    id: 'tire-tread',
    section: 'tires-brakes',
    label: 'Tires have good tread depth',
    help: 'Use a coin or tread gauge. Under 3 mm (4/32") means new tires soon.',
    weight: 3,
    cost: { worn: [300, 600], problem: [600, 1200] },
  },
  {
    id: 'tire-wear',
    section: 'tires-brakes',
    label: 'Tires wear evenly across the tread',
    help: 'Wear on just the inside or outside edge points to alignment or suspension problems.',
    weight: 3,
    cost: { worn: [100, 200], problem: [400, 1500] },
  },
  {
    id: 'tire-match',
    section: 'tires-brakes',
    label: 'All four tires match',
    help: 'Mismatched brands or sizes suggest corners were cut on upkeep.',
    weight: 1,
    cost: { problem: [200, 500] },
  },
  {
    id: 'brake-discs',
    section: 'tires-brakes',
    label: 'Brake discs are smooth, without deep grooves',
    help: 'Look through the wheel spokes. A raised lip at the disc edge means heavy wear.',
    weight: 3,
    cost: { worn: [250, 500], problem: [500, 1000] },
  },

  // ---------- engine ----------
  {
    id: 'cold-start',
    section: 'engine',
    label: 'Starts easily from cold and idles smoothly',
    help: 'Put your hand on the hood before starting: it should be cool. Listen for rattles in the first seconds.',
    weight: 4,
    cost: { worn: [150, 600], problem: [800, 3000] },
  },
  {
    id: 'exhaust-smoke',
    section: 'engine',
    label: 'No smoke from the exhaust after warm-up',
    help: 'A little white vapour on a cold day is normal. Smoke that keeps coming is not.',
    weight: 4,
    cost: { worn: [200, 800] },
  },
  {
    id: 'smoke-blue',
    section: 'engine',
    label: 'Smoke is not blue-grey (burning oil)',
    help: 'Blue-grey smoke means oil is getting into the engine: worn rings or valve seals.',
    weight: 4,
    cost: { problem: [1500, 4000] },
    showIf: { item: 'exhaust-smoke', ratings: ['worn', 'problem'] },
  },
  {
    id: 'smoke-white',
    section: 'engine',
    label: 'Smoke is not thick and white with a sweet smell (coolant)',
    help: 'Thick white smoke that does not clear usually means a head gasket. Walk away.',
    weight: 5,
    dealbreaker: true,
    showIf: { item: 'exhaust-smoke', ratings: ['worn', 'problem'] },
  },
  {
    id: 'oil-condition',
    section: 'engine',
    label: 'Oil level is right and looks clean',
    help: 'Pull the dipstick. Milky or frothy oil is a head gasket warning. Very dark, gritty oil means skipped changes.',
    weight: 3,
    cost: { worn: [80, 150] },
  },
  {
    id: 'fluid-leaks',
    section: 'engine',
    label: 'No fluid leaks under the car or on the engine',
    help: 'Look at the ground where the car was parked and around the engine. Note the colour of any drips.',
    weight: 3,
    cost: { worn: [100, 400], problem: [300, 1200] },
  },
  {
    id: 'leak-source',
    section: 'engine',
    label: 'Leak is not from the engine or transmission seals',
    help: 'Oil around the oil pan or where the engine meets the transmission means seal work, which is labour-heavy.',
    weight: 4,
    cost: { problem: [800, 2500] },
    showIf: { item: 'fluid-leaks', ratings: ['worn', 'problem'] },
  },
  {
    id: 'belts-hoses',
    section: 'engine',
    label: 'Belts and hoses are not cracked or bulging',
    help: 'Squeeze the hoses gently when the engine is cool. They should feel firm, not crunchy or soft.',
    weight: 2,
    cost: { worn: [100, 300], problem: [200, 600] },
  },
  {
    id: 'battery',
    section: 'engine',
    label: 'Battery terminals are clean and the battery is under 5 years old',
    help: 'The date is usually printed on a sticker. White crust on the terminals is corrosion.',
    weight: 1,
    cost: { worn: [20, 50], problem: [150, 300] },
  },

  // ---------- interior ----------
  {
    id: 'warning-lights',
    section: 'interior',
    label: 'Dashboard warning lights go out after start',
    help: 'All lights should come on with the key, then turn off. A light that never comes on may have been disabled.',
    weight: 4,
    cost: { worn: [100, 400], problem: [300, 1500] },
  },
  {
    id: 'ac-heat',
    section: 'interior',
    label: 'Air conditioning blows cold and heat blows hot',
    help: 'Test both at full blast. Weak A/C is often a leak, which is more than a simple recharge.',
    weight: 2,
    cost: { worn: [150, 300], problem: [500, 1800] },
  },
  {
    id: 'electrics',
    section: 'interior',
    label: 'Windows, locks, mirrors and infotainment all work',
    help: 'Try every switch from every seat, including the rear windows and the trunk release.',
    weight: 2,
    cost: { worn: [50, 200], problem: [200, 800] },
  },
  {
    id: 'water-damage',
    section: 'interior',
    label: 'No damp carpet, musty smell or silt under the seats',
    help: 'Lift the floor mats and the trunk floor. Rust on seat bolts or silt in odd places points to flood damage.',
    weight: 5,
    dealbreaker: true,
  },
  {
    id: 'mileage-wear',
    section: 'interior',
    label: 'Wear on the seat, wheel and pedals fits the odometer',
    help: 'A worn-through steering wheel on a low-mileage car is a sign the odometer may have been rolled back.',
    weight: 3,
  },

  // ---------- test drive ----------
  {
    id: 'transmission',
    section: 'test-drive',
    label: 'Transmission shifts smoothly, no slipping or clunks',
    help: 'Watch the revs: if they jump without the car speeding up, the transmission is slipping.',
    weight: 5,
    dealbreaker: true,
    cost: { worn: [150, 400] },
  },
  {
    id: 'braking',
    section: 'test-drive',
    label: 'Brakes stop straight without pulling, grinding or pulsing',
    help: 'Do one firm stop on an empty road. The car should stay straight and the pedal should feel firm.',
    weight: 4,
    cost: { worn: [250, 500], problem: [500, 1200] },
  },
  {
    id: 'steering',
    section: 'test-drive',
    label: 'Steering is straight and tight, the car does not wander',
    help: 'On a straight road, loosen your grip briefly. The car should hold its line.',
    weight: 3,
    cost: { worn: [100, 200], problem: [400, 1500] },
  },
  {
    id: 'suspension',
    section: 'test-drive',
    label: 'No clunks or bouncing over bumps',
    help: 'Drive over a few rough patches with the radio off. Clunks point to worn links or bushings.',
    weight: 3,
    cost: { worn: [200, 600], problem: [800, 2000] },
  },
  {
    id: 'highway-noise',
    section: 'test-drive',
    label: 'Quiet and steady at highway speed',
    help: 'A hum that rises with speed is often a wheel bearing. Vibration through the wheel can be balance or worse.',
    weight: 2,
    cost: { worn: [100, 300], problem: [300, 900] },
  },
];

export const ITEM_BY_ID: ReadonlyMap<string, ChecklistItem> = new Map(CHECKLIST.map((i) => [i.id, i]));
