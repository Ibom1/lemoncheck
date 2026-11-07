import { useState } from 'react';
import { MIN_ANSWERS_FOR_VERDICT, assess, carName, money, summaryText } from '../engine/assess';
import type { Inspection } from '../engine/types';
import { ScoreRing } from '../components/ScoreBadge';
import { href } from '../router';

export function ReportPage({ inspection }: { inspection: Inspection }) {
  const a = assess(inspection);
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const asking = inspection.car.askingPrice;
  const issues = a.repairs.lines;

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText(inspection));
      setCopied('done');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <main className="page">
      <a className="back" href={href({ name: 'inspect', id: inspection.id })}>
        ← Back to the checklist
      </a>

      <header className={`verdict tone-${a.verdict.id}`}>
        <ScoreRing score={a.score} verdict={a.verdict.id} />
        <div className="verdict-text">
          <p className="eyebrow">{carName(inspection.car)}</p>
          <h1>{a.verdict.title}</h1>
          <p>{a.verdict.advice}</p>
          {a.verdict.because && <p className="because">{a.verdict.because}</p>}
          <p className="muted">
            Based on {a.answered} of {a.total} items checked.
            {a.answered < MIN_ANSWERS_FOR_VERDICT && ` Check at least ${MIN_ANSWERS_FOR_VERDICT} for a verdict.`}
          </p>
        </div>
      </header>

      {a.dealbreakers.length > 0 && (
        <section className="panel panel-danger">
          <h2>Deal-breakers</h2>
          <ul className="plain">
            {a.dealbreakers.map((d) => (
              <li key={d.id}>
                <strong>{d.label}</strong>
                <span className="muted"> {d.help}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2">
        <section className="panel">
          <h2>Money</h2>
          <dl className="money">
            <div>
              <dt>Asking price</dt>
              <dd>{asking !== null ? money(asking) : '–'}</dd>
            </div>
            <div>
              <dt>Estimated repairs</dt>
              <dd>{issues.length ? `${money(a.repairs.low)}–${money(a.repairs.high)}` : money(0)}</dd>
            </div>
            <div>
              <dt>Real cost to you</dt>
              <dd>{a.trueCost !== null ? money(a.trueCost) : '–'}</dd>
            </div>
            <div className="money-offer">
              <dt>Suggested offer</dt>
              <dd>{a.offer !== null ? money(a.offer) : '–'}</dd>
            </div>
          </dl>
          {asking === null ? (
            <p className="muted">
              <a href={href({ name: 'edit', id: inspection.id })}>Add the asking price</a> to get a suggested offer.
            </p>
          ) : (
            <p className="muted">
              The offer is the asking price minus the middle of the repair estimate. Open a little lower and explain the
              issues you found.
            </p>
          )}
          {a.repairs.unpriced > 0 && (
            <p className="muted">
              {a.repairs.unpriced} issue{a.repairs.unpriced === 1 ? " isn't" : "s aren't"} priced; have a mechanic look
              at {a.repairs.unpriced === 1 ? 'it' : 'them'}.
            </p>
          )}
        </section>

        <section className="panel">
          <h2>Mileage</h2>
          {a.mileage ? (
            <p className={`mileage mileage-${a.mileage.status}`}>{a.mileage.message}</p>
          ) : (
            <p className="muted">Add the year and odometer reading to check whether the mileage looks right.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>
          Issues found <span className="count">{issues.length}</span>
        </h2>
        {issues.length === 0 ? (
          <p className="muted">Nothing rated worn or a problem yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="issues">
              <thead>
                <tr>
                  <th scope="col">Issue</th>
                  <th scope="col">Rating</th>
                  <th scope="col" className="num">
                    Typical repair
                  </th>
                </tr>
              </thead>
              <tbody>
                {issues.map((l) => (
                  <tr key={l.item.id}>
                    <td>
                      {l.item.label}
                      {inspection.answers[l.item.id]?.note && (
                        <div className="muted small">“{inspection.answers[l.item.id]!.note}”</div>
                      )}
                    </td>
                    <td>
                      <span className={`chip chip-${l.rating}`}>{l.rating === 'worn' ? 'Worn' : 'Problem'}</span>
                    </td>
                    <td className="num">{l.cost ? `${money(l.cost[0])}–${money(l.cost[1])}` : 'Ask a mechanic'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={copy}>
          {copied === 'done' ? 'Summary copied' : 'Copy summary'}
        </button>
        <a className="btn" href={href({ name: 'inspect', id: inspection.id })}>
          Keep checking
        </a>
      </div>
      {copied === 'failed' && (
        <pre className="summary" aria-label="Summary text">
          {summaryText(inspection)}
        </pre>
      )}

      <p className="foot muted">
        Repair costs are rough averages for an independent shop and vary by car and region. Before you buy, a mechanic's
        pre-purchase inspection is worth the money.
      </p>
    </main>
  );
}
