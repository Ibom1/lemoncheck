import { CHECKLIST, SECTIONS } from '../data/checklist';
import type { Answer, ChecklistItem, SectionId } from './types';

/**
 * Items the buyer should see, given their answers so far.
 * A follow-up item appears only while the item it depends on has a matching
 * rating; if that answer changes, the follow-up disappears again and its
 * answer stops counting.
 */
export function visibleItems(
  answers: Record<string, Answer>,
  checklist: readonly ChecklistItem[] = CHECKLIST,
): ChecklistItem[] {
  const byId = new Map(checklist.map((i) => [i.id, i]));
  const memo = new Map<string, boolean>();

  const isVisible = (item: ChecklistItem, seen: Set<string>): boolean => {
    const cached = memo.get(item.id);
    if (cached !== undefined) return cached;
    let visible = true;
    if (item.showIf) {
      const parent = byId.get(item.showIf.item);
      if (!parent || seen.has(parent.id)) {
        visible = false; // broken or circular rule: never show, never count
      } else {
        const rating = answers[parent.id]?.rating;
        visible =
          isVisible(parent, new Set([...seen, item.id])) &&
          rating !== undefined &&
          item.showIf.ratings.includes(rating);
      }
    }
    memo.set(item.id, visible);
    return visible;
  };

  return checklist.filter((item) => isVisible(item, new Set([item.id])));
}

/** Answers that currently count: for visible items only. */
export function activeAnswers(
  answers: Record<string, Answer>,
  checklist: readonly ChecklistItem[] = CHECKLIST,
): Array<{ item: ChecklistItem; answer: Answer }> {
  return visibleItems(answers, checklist)
    .filter((item) => answers[item.id])
    .map((item) => ({ item, answer: answers[item.id] }));
}

export interface SectionProgress {
  id: SectionId;
  answered: number;
  total: number;
}

export function progress(
  answers: Record<string, Answer>,
  checklist: readonly ChecklistItem[] = CHECKLIST,
): { sections: SectionProgress[]; answered: number; total: number } {
  const visible = visibleItems(answers, checklist);
  const sections = SECTIONS.map((s) => {
    const items = visible.filter((i) => i.section === s.id);
    return { id: s.id, answered: items.filter((i) => answers[i.id]).length, total: items.length };
  });
  return {
    sections,
    answered: sections.reduce((n, s) => n + s.answered, 0),
    total: sections.reduce((n, s) => n + s.total, 0),
  };
}
