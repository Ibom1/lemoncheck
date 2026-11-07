import { useState, type FormEvent } from 'react';
import { newInspection } from '../engine/storage';
import type { CarDetails, DistanceUnit, Inspection } from '../engine/types';
import { href } from '../router';

const THIS_YEAR = new Date().getFullYear();

/** Parse "12,500" or "12500" into a whole number; empty means "not given". */
export function parseWhole(text: string): number | null | 'invalid' {
  const clean = text.replace(/[,\s$]/g, '');
  if (clean === '') return null;
  if (!/^\d+$/.test(clean)) return 'invalid';
  return Number(clean);
}

interface Props {
  existing?: Inspection;
  onSave: (inspection: Inspection) => void;
}

export function CarFormPage({ existing, onSave }: Props) {
  const c = existing?.car;
  const [make, setMake] = useState(c?.make ?? '');
  const [model, setModel] = useState(c?.model ?? '');
  const [year, setYear] = useState(c?.year?.toString() ?? '');
  const [mileage, setMileage] = useState(c?.mileage?.toString() ?? '');
  const [unit, setUnit] = useState<DistanceUnit>(c?.unit ?? 'km');
  const [price, setPrice] = useState(c?.askingPrice?.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!make.trim()) errs.make = 'Enter the make, e.g. Toyota.';
    if (!model.trim()) errs.model = 'Enter the model, e.g. Corolla.';
    const y = parseWhole(year);
    if (y === 'invalid' || (y !== null && (y < 1950 || y > THIS_YEAR + 1))) errs.year = `Enter a year between 1950 and ${THIS_YEAR + 1}.`;
    const m = parseWhole(mileage);
    if (m === 'invalid' || (m !== null && m > 2_000_000)) errs.mileage = 'Enter the odometer reading as a whole number.';
    const p = parseWhole(price);
    if (p === 'invalid' || (p !== null && p > 10_000_000)) errs.price = 'Enter the asking price as a whole number, e.g. 12500.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const car: CarDetails = {
      make: make.trim(),
      model: model.trim(),
      year: y as number | null,
      mileage: m as number | null,
      unit,
      askingPrice: p as number | null,
    };
    onSave(existing ? { ...existing, car } : newInspection(car));
  }

  const field = (id: string) => (errors[id] ? { 'aria-invalid': true, 'aria-describedby': `${id}-err` } : {});

  return (
    <main className="page page-narrow">
      <a className="back" href={existing ? href({ name: 'inspect', id: existing.id }) : href({ name: 'home' })}>
        ← Back
      </a>
      <h1>{existing ? 'Edit car details' : 'Which car are you looking at?'}</h1>
      <p className="muted">
        Only the car's details go here. Don't enter the seller's name, phone number or the licence plate.
      </p>
      <form className="form" onSubmit={submit} noValidate>
        <div className="row">
          <label className="field">
            <span>Make</span>
            <input id="make" value={make} onChange={(e) => setMake(e.target.value)} maxLength={40} autoComplete="off" {...field('make')} />
            {errors.make && <small id="make-err" className="error">{errors.make}</small>}
          </label>
          <label className="field">
            <span>Model</span>
            <input id="model" value={model} onChange={(e) => setModel(e.target.value)} maxLength={40} autoComplete="off" {...field('model')} />
            {errors.model && <small id="model-err" className="error">{errors.model}</small>}
          </label>
        </div>
        <div className="row">
          <label className="field">
            <span>Year</span>
            <input id="year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2018" {...field('year')} />
            {errors.year && <small id="year-err" className="error">{errors.year}</small>}
          </label>
          <label className="field">
            <span>Odometer</span>
            <div className="with-unit">
              <input id="mileage" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="120,000" {...field('mileage')} />
              <select id="unit" aria-label="Distance unit" value={unit} onChange={(e) => setUnit(e.target.value as DistanceUnit)}>
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
            {errors.mileage && <small id="mileage-err" className="error">{errors.mileage}</small>}
          </label>
        </div>
        <label className="field">
          <span>Asking price</span>
          <input id="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12,500" {...field('price')} />
          {errors.price && <small id="price-err" className="error">{errors.price}</small>}
          <small className="muted">Needed for the suggested offer. You can add it later.</small>
        </label>
        <button className="btn btn-primary" type="submit">
          {existing ? 'Save details' : 'Start the checklist'}
        </button>
      </form>
    </main>
  );
}
