import { useMemo, useState } from 'react';
import { SECTIONS } from '../data/checklist';
import { carName } from '../engine/assess';
import { progress, visibleItems } from '../engine/checklist';
import type { Answer, Inspection, SectionId } from '../engine/types';
import { ItemCard } from '../components/ItemCard';
import { href } from '../router';

interface Props {
  inspection: Inspection;
  onChange: (inspection: Inspection) => void;
}

export function InspectPage({ inspection, onChange }: Props) {
  const p = useMemo(() => progress(inspection.answers), [inspection.answers]);
  const firstOpen = p.sections.find((s) => s.answered < s.total)?.id ?? SECTIONS[0].id;
  const [current, setCurrent] = useState<SectionId>(firstOpen);

  const section = SECTIONS.find((s) => s.id === current)!;
  const items = visibleItems(inspection.answers).filter((i) => i.section === current);
  const index = SECTIONS.findIndex((s) => s.id === current);
  const next = SECTIONS[index + 1];

  function setAnswer(id: string, answer: Answer | undefined) {
    const answers = { ...inspection.answers };
    if (answer) answers[id] = answer;
    else delete answers[id];
    onChange({ ...inspection, answers });
  }

  function open(id: SectionId) {
    setCurrent(id);
    window.scrollTo({ top: 0 });
  }

  const pct = p.total ? Math.round((p.answered / p.total) * 100) : 0;
  const { car } = inspection;
  const sub = [
    car.mileage !== null ? `${car.mileage.toLocaleString('en-CA')} ${car.unit}` : null,
    car.askingPrice !== null ? `asking $${car.askingPrice.toLocaleString('en-CA')}` : null,
  ].filter(Boolean);

  return (
    <main className="page page-inspect">
      <a className="back" href={href({ name: 'home' })}>
        ← All inspections
      </a>
      <header className="inspect-head">
        <div>
          <h1>{carName(car)}</h1>
          <p className="muted">
            {sub.join(' · ') || 'No mileage or price yet'} ·{' '}
            <a href={href({ name: 'edit', id: inspection.id })}>Edit details</a>
          </p>
        </div>
      </header>

      <nav className="tabs" aria-label="Checklist sections">
        {p.sections.map((s) => {
          const meta = SECTIONS.find((x) => x.id === s.id)!;
          const done = s.total > 0 && s.answered === s.total;
          return (
            <button
              key={s.id}
              type="button"
              className={`tab${s.id === current ? ' tab-on' : ''}${done ? ' tab-done' : ''}`}
              aria-current={s.id === current ? 'step' : undefined}
              onClick={() => open(s.id)}
            >
              <span>{meta.title}</span>
              <small>
                {s.answered}/{s.total}
              </small>
            </button>
          );
        })}
      </nav>

      <section aria-labelledby="section-title">
        <h2 id="section-title" className="section-title">
          {section.title}
        </h2>
        <p className="muted section-intro">{section.intro}</p>
        <ul className="items">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              answer={inspection.answers[item.id]}
              followUp={Boolean(item.showIf)}
              onChange={(a) => setAnswer(item.id, a)}
            />
          ))}
        </ul>
      </section>

      <div className="dock">
        <div className="dock-inner">
          <div className="dock-progress" aria-label={`${p.answered} of ${p.total} items checked`}>
            <div className="bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <small>
              {p.answered} of {p.total} checked
            </small>
          </div>
          {next ? (
            <button type="button" className="btn" onClick={() => open(next.id)}>
              Next: {next.title}
            </button>
          ) : null}
          <a className="btn btn-primary" href={href({ name: 'report', id: inspection.id })}>
            See report
          </a>
        </div>
      </div>
    </main>
  );
}
