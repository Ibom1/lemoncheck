import { useState } from 'react';
import { isDemo } from '../data/demo';
import { assess, carName, money } from '../engine/assess';
import type { Inspection } from '../engine/types';
import { ScoreRing, VerdictPill } from '../components/ScoreBadge';
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
    <main className="page page-home">
      <header className="home-brand">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="32" height="32" />
        <span>lemoncheck</span>
      </header>

      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Used-car inspection</p>
          <h1 id="home-title">Know the car <span>before you buy.</span></h1>
          <p className="lead">
            Follow a guided walkaround, spot deal-breakers, and see how estimated repairs could affect your offer.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href={href({ name: 'new' })}>
              Start an inspection <span aria-hidden="true">↗</span>
            </a>
            {!hasDemo && (
              <button type="button" className="btn" onClick={onLoadDemo}>Try sample cars</button>
            )}
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <svg viewBox="0 0 360 228" focusable="false">
            <defs>
              <pattern id="inspection-grid" width="18" height="18" patternUnits="userSpaceOnUse">
                <path d="M18 0H0V18" fill="none" stroke="#4b5043" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="1" y="1" width="358" height="226" rx="18" fill="url(#inspection-grid)" stroke="#565c4c" />
            <path d="M22 76V52h24m268 0h24v24M22 154v24h24m268 0h24v-24"
              stroke="#e5f278" strokeWidth="2" fill="none" />
            <path d="M35 151h290M180 50v112" stroke="#78806d" strokeDasharray="4 6" />
            <path d="M48 132l7-23 37-9 32-28c8-7 18-11 30-11h49c13 0 24 4 34 13l31 27 27 7 16 17v17h-23m-48 0H124m-48 0H48z"
              fill="#252a20" stroke="#e5f278" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M109 100l25-21c6-5 13-8 22-8h44c10 0 19 3 26 10l21 19zm70-29v29m-41 13h14m61 0h14"
              fill="none" stroke="#a8b68a" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="100" cy="143" r="23" fill="#24291e" stroke="#e5f278" strokeWidth="2.5" />
            <circle cx="264" cy="143" r="23" fill="#24291e" stroke="#e5f278" strokeWidth="2.5" />
            <circle cx="100" cy="143" r="9" fill="none" stroke="#a8b68a" strokeWidth="2" />
            <circle cx="264" cy="143" r="9" fill="none" stroke="#a8b68a" strokeWidth="2" />
            <text x="22" y="29">INSPECTION FIELD GUIDE</text>
            <text x="22" y="207">BODY / ENGINE / ROAD TEST</text>
          </svg>
        </div>
      </section>

      {sorted.length === 0 ? (
        <section className="empty">
          <h2>No inspections yet</h2>
          <ol className="steps">
            <li>Enter the car's make, model, year, mileage and asking price.</li>
            <li>Go through six sections: paperwork, exterior, tires, engine, interior and the test drive.</li>
            <li>Get a verdict, the issues to fix, and a suggested offer.</li>
          </ol>
        </section>
      ) : (
        <section>
          <div className="garage-head">
            <div>
              <p className="eyebrow">Inspection history</p>
              <h2 className="section-title">Your inspections <span className="count">{sorted.length}</span></h2>
            </div>
            <div className="actions">
              {inspections.length >= 2 && (
                <a className="btn" href={href({ name: 'compare' })}>Compare {inspections.length} cars</a>
              )}
              <button type="button" className="btn" onClick={hasDemo ? onClearDemo : onLoadDemo}>
                {hasDemo ? 'Remove sample cars' : 'Try sample cars'}
              </button>
            </div>
          </div>
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
                    </div>
                    <div className="card-condition">
                      <ScoreRing score={a.score} verdict={a.verdict.id} size={62} />
                      <div>
                        <p className="eyebrow">Condition</p>
                        <VerdictPill verdict={a.verdict.id} title={a.verdict.title} />
                      </div>
                    </div>
                    <dl className="facts">
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
                    <a href={href({ name: 'report', id: i.id })}>View report <span aria-hidden="true">↗</span></a>
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
        Inspections stay in this browser.
        Repair costs are rough estimates. For a purchase decision, consider a mechanic’s pre-purchase inspection.
      </footer>
    </main>
  );
}
