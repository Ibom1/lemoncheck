import { carName, money, rank } from '../engine/assess';
import type { Inspection } from '../engine/types';
import { VerdictPill } from '../components/ScoreBadge';
import { href } from '../router';

export function ComparePage({ inspections }: { inspections: Inspection[] }) {
  const ranked = rank(inspections);

  return (
    <main className="page">
      <a className="back" href={href({ name: 'home' })}>
        ← All inspections
      </a>
      <h1>Compare cars</h1>
      <p className="muted">
        Ranked by real cost (asking price plus the middle of the repair estimate). Cars with a deal-breaker go last.
      </p>

      {ranked.length < 2 ? (
        <p>Inspect at least two cars to compare them.</p>
      ) : (
        <div className="table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Car</th>
                <th scope="col">Verdict</th>
                <th scope="col" className="num">Score</th>
                <th scope="col" className="num">Asking</th>
                <th scope="col" className="num">Repairs</th>
                <th scope="col" className="num">Real cost</th>
                <th scope="col" className="num">Offer</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ inspection: i, assessment: a }, n) => (
                <tr key={i.id} className={n === 0 && a.dealbreakers.length === 0 ? 'best' : undefined}>
                  <td className="num">{n + 1}</td>
                  <td>
                    <a href={href({ name: 'report', id: i.id })}>{carName(i.car)}</a>
                    {n === 0 && a.dealbreakers.length === 0 && <div className="small best-note">Best value</div>}
                  </td>
                  <td>
                    <VerdictPill verdict={a.verdict.id} title={a.verdict.title} />
                  </td>
                  <td className="num">{a.score ?? '–'}</td>
                  <td className="num">{i.car.askingPrice !== null ? money(i.car.askingPrice) : '–'}</td>
                  <td className="num">{a.repairs.lines.length ? `${money(a.repairs.low)}–${money(a.repairs.high)}` : '–'}</td>
                  <td className="num">{a.trueCost !== null ? money(a.trueCost) : '–'}</td>
                  <td className="num">{a.offer !== null ? money(a.offer) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
