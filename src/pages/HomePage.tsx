import { useState } from 'react';
import { isDemo } from '../data/demo';
import { assess, carName, money } from '../engine/assess';
import type { Inspection } from '../engine/types';
import { VerdictPill } from '../components/ScoreBadge';
import { href } from '../router';

interface Props {
  inspections: Inspection[];
  onDelete: (id: string) => void;
  onLoadDemo: () => void;
  onClearDemo: () => void;
}

export function HomePage({ inspections, onDelete, onLoadDemo, onClearDemo }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const sorted = [...inspections].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const hasDemo = inspections.some(isDemo);

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Used car inspection</p>
        <h1>lemoncheck</h1>
        <p className="lead">
          Walk around a used car with a checklist that tells you what to look for. Get a condition score, a list of
          problems with typical repair costs, and an offer that accounts for them.
        </p>
        <div className="actions">
          <a className="btn btn-primary" href={href({ name: 'new' })}>
            Start a new inspection
          </a>
          {inspections.length >= 2 && (
            <a className="btn" href={href({ name: 'compare' })}>
              Compare {inspections.length} cars
            </a>
          )}
          {hasDemo ? (
            <button type="button" className="btn" onClick={onClearDemo}>
              Remove sample cars
            </button>
          ) : (
            <button type="button" className="btn" onClick={onLoadDemo}>
              Try a demo
            </button>
          )}
        </div>
        {!hasDemo && inspections.length === 0 && (
          <p className="muted small">The demo adds three made-up cars so you can see a report and a comparison.</p>
        )}
      </header>

      {sorted.length === 0 ? (
        <section className="empty">
          <h2>No inspections yet</h2>
          <ol className="steps">
            <li>Enter the car's make, model, year, mileage and asking price.</li>
            <li>Go through six sections: paperwork, exterior, tires, engine, interior and the test drive.</li>
            <li>Get a verdict, the issues to fix, and a suggested offer.</li>
          </ol>
          <p className="muted">Everything is saved in this browser only. Nothing is sent anywhere.</p>
        </section>
      ) : (
        <section>
          <h2 className="section-title">Your inspections</h2>
          <ul className="cards">
            {sorted.map((i) => {
              const a = assess(i);
              return (
                <li key={i.id} className="card">
                  <a className="card-main" href={href({ name: 'inspect', id: i.id })}>
                    <div className="card-top">
                      <h3>
                        {carName(i.car)}
                        {isDemo(i) && <span className="tag sample">Sample</span>}
                      </h3>
                      <VerdictPill verdict={a.verdict.id} title={a.verdict.title} />
                    </div>
                    <dl className="facts">
                      <div>
                        <dt>Score</dt>
                        <dd>{a.score ?? '–'}</dd>
                      </div>
                      <div>
                        <dt>Asking</dt>
                        <dd>{i.car.askingPrice !== null ? money(i.car.askingPrice) : '–'}</dd>
                      </div>
                      <div>
                        <dt>Repairs</dt>
                        <dd>{a.repairs.lines.length ? `${money(a.repairs.low)}–${money(a.repairs.high)}` : '–'}</dd>
                      </div>
                      <div>
                        <dt>Checked</dt>
                        <dd>
                          {a.answered}/{a.total}
                        </dd>
                      </div>
                    </dl>
                  </a>
                  <div className="card-foot">
                    <a href={href({ name: 'report', id: i.id })}>Report</a>
                    {confirming === i.id ? (
                      <span className="confirm">
                        Delete this inspection?
                        <button type="button" className="link danger" onClick={() => onDelete(i.id)}>
                          Delete
                        </button>
                        <button type="button" className="link" onClick={() => setConfirming(null)}>
                          Keep
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="link" onClick={() => setConfirming(i.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="foot muted">
        lemoncheck helps you spot problems; it doesn't replace a mechanic's pre-purchase inspection. Repair costs are
        rough averages.
      </footer>
    </main>
  );
}
