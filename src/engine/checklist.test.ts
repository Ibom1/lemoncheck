import { describe, expect, it } from 'vitest';
import { CHECKLIST, SECTIONS } from '../data/checklist';
import { activeAnswers, progress, visibleItems } from './checklist';
import type { Answer, ChecklistItem } from './types';

const ids = (items: ChecklistItem[]) => items.map((i) => i.id);

describe('checklist data', () => {
  it('has unique item ids', () => {
    const all = CHECKLIST.map((i) => i.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it('puts every item in a known section, and every section has items', () => {
    const sectionIds = SECTIONS.map((s) => s.id);
    for (const item of CHECKLIST) expect(sectionIds).toContain(item.section);
    for (const s of SECTIONS) expect(CHECKLIST.some((i) => i.section === s.id)).toBe(true);
  });

  it('only has follow-ups that point at an earlier item in the same section', () => {
    CHECKLIST.forEach((item, index) => {
      if (!item.showIf) return;
      const parentIndex = CHECKLIST.findIndex((i) => i.id === item.showIf!.item);
      expect(parentIndex).toBeGreaterThan(-1);
      expect(parentIndex).toBeLessThan(index);
      expect(CHECKLIST[parentIndex].section).toBe(item.section);
    });
  });

  it('has sensible cost ranges', () => {
    for (const item of CHECKLIST) {
      for (const range of [item.cost?.worn, item.cost?.problem]) {
        if (!range) continue;
        expect(range[0]).toBeGreaterThan(-1);
        expect(range[1]).toBeGreaterThan(range[0] - 1);
      }
    }
  });
});

describe('follow-up items', () => {
  it('are hidden until their trigger is answered', () => {
    expect(ids(visibleItems({}))).not.toContain('frame-rust');
    expect(ids(visibleItems({ 'body-rust': { rating: 'good' } }))).not.toContain('frame-rust');
    expect(ids(visibleItems({ 'body-rust': { rating: 'worn' } }))).toContain('frame-rust');
  });

  it('stop counting when the trigger answer changes', () => {
    const answers: Record<string, Answer> = {
      'body-rust': { rating: 'good' },
      'frame-rust': { rating: 'problem' }, // left over from before
    };
    expect(activeAnswers(answers).map((a) => a.item.id)).toEqual(['body-rust']);
  });

  it('chain through several levels and ignore broken rules', () => {
    const list: ChecklistItem[] = [
      { id: 'a', section: 'engine', label: 'A', help: '', weight: 1 },
      { id: 'b', section: 'engine', label: 'B', help: '', weight: 1, showIf: { item: 'a', ratings: ['problem'] } },
      { id: 'c', section: 'engine', label: 'C', help: '', weight: 1, showIf: { item: 'b', ratings: ['problem'] } },
      { id: 'd', section: 'engine', label: 'D', help: '', weight: 1, showIf: { item: 'missing', ratings: ['good'] } },
      { id: 'e', section: 'engine', label: 'E', help: '', weight: 1, showIf: { item: 'f', ratings: ['good'] } },
      { id: 'f', section: 'engine', label: 'F', help: '', weight: 1, showIf: { item: 'e', ratings: ['good'] } },
    ];
    expect(ids(visibleItems({ a: { rating: 'problem' } }, list))).toEqual(['a', 'b']);
    // c needs b, which is hidden once a is fixed, even if b still has an answer
    expect(ids(visibleItems({ a: { rating: 'good' }, b: { rating: 'problem' } }, list))).toEqual(['a']);
    expect(ids(visibleItems({ a: { rating: 'problem' }, b: { rating: 'problem' } }, list))).toEqual(['a', 'b', 'c']);
  });
});

describe('progress', () => {
  it('counts answered and visible items per section', () => {
    const p = progress({ 'clean-title': { rating: 'good' }, 'body-rust': { rating: 'problem' } });
    const exterior = p.sections.find((s) => s.id === 'exterior')!;
    const paperwork = p.sections.find((s) => s.id === 'paperwork')!;
    expect(paperwork.answered).toBe(1);
    expect(exterior.answered).toBe(1);
    // frame-rust is now visible, so the exterior total grows by one
    expect(exterior.total).toBe(CHECKLIST.filter((i) => i.section === 'exterior' && i.id !== 'paint-match').length);
    expect(p.answered).toBe(2);
  });
});
