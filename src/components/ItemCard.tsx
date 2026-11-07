import { useId, useState } from 'react';
import { money } from '../engine/assess';
import type { Answer, ChecklistItem, Rating } from '../engine/types';

const OPTIONS: Array<{ rating: Rating; label: string }> = [
  { rating: 'good', label: 'Good' },
  { rating: 'worn', label: 'Worn' },
  { rating: 'problem', label: 'Problem' },
  { rating: 'skip', label: "Can't check" },
];

interface Props {
  item: ChecklistItem;
  answer: Answer | undefined;
  followUp: boolean;
  onChange: (answer: Answer | undefined) => void;
}

export function ItemCard({ item, answer, followUp, onChange }: Props) {
  const [showHelp, setShowHelp] = useState(false);
  const noteId = useId();
  const rating = answer?.rating;
  const cost = rating === 'worn' || rating === 'problem' ? item.cost?.[rating] : undefined;
  const showNote = rating === 'worn' || rating === 'problem' || Boolean(answer?.note);

  return (
    <li className={`item${followUp ? ' item-follow' : ''}${rating ? ` rated-${rating}` : ''}`}>
      <div className="item-head">
        <div className="item-title">
          {followUp && <span className="tag">Follow-up</span>}
          {item.dealbreaker && <span className="tag tag-danger">Deal-breaker if failed</span>}
          <h3>{item.label}</h3>
        </div>
        <button type="button" className="link" aria-expanded={showHelp} onClick={() => setShowHelp(!showHelp)}>
          {showHelp ? 'Hide tip' : 'How to check'}
        </button>
      </div>
      {showHelp && <p className="item-help">{item.help}</p>}

      <div className="rating" role="radiogroup" aria-label={item.label}>
        {OPTIONS.map((o) => (
          <button
            key={o.rating}
            type="button"
            role="radio"
            aria-checked={rating === o.rating}
            className={`rate rate-${o.rating}`}
            onClick={() => onChange(rating === o.rating ? undefined : { ...answer, rating: o.rating })}
          >
            {o.label}
          </button>
        ))}
      </div>

      {cost && (
        <p className="item-cost">
          Typical repair: {money(cost[0])}–{money(cost[1])}
        </p>
      )}
      {rating === 'problem' && item.dealbreaker && (
        <p className="item-alert">This is a deal-breaker. Don't buy without a mechanic's opinion.</p>
      )}

      {showNote && rating && (
        <div className="item-note">
          <label htmlFor={noteId}>What you saw</label>
          <input
            id={noteId}
            type="text"
            maxLength={500}
            value={answer?.note ?? ''}
            placeholder="e.g. rust bubble on rear left arch"
            onChange={(e) => onChange({ rating, note: e.target.value || undefined })}
          />
        </div>
      )}
    </li>
  );
}
