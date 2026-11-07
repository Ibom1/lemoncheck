import type { VerdictId } from '../engine/assess';

/** A circular gauge for the 0–100 condition score. */
export function ScoreRing({ score, verdict, size = 120 }: { score: number | null; verdict: VerdictId; size?: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const filled = score === null ? 0 : (score / 100) * circumference;
  return (
    <svg className={`ring tone-${verdict}`} width={size} height={size} viewBox="0 0 100 100" role="img"
      aria-label={score === null ? 'No score yet' : `Condition score ${score} out of 100`}>
      <circle className="ring-track" cx="50" cy="50" r={r} />
      <circle
        className="ring-fill"
        cx="50"
        cy="50"
        r={r}
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" className="ring-number" textAnchor="middle" dominantBaseline="central">
        {score ?? '–'}
      </text>
      <text x="50" y="70" className="ring-unit" textAnchor="middle">
        / 100
      </text>
    </svg>
  );
}

export function VerdictPill({ verdict, title }: { verdict: VerdictId; title: string }) {
  return <span className={`pill tone-${verdict}`}>{title}</span>;
}
