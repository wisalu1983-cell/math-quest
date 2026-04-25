import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateQuestion } from '@/engine';
import { getSubtypeEntries, usesA07KnowledgeEntries } from './multi-step';

const LAW_TAGS = [
  'law-identify',
  'law-simple-judge',
  'law-structure-blank',
  'law-reverse-blank',
  'law-counter-example',
  'law-concept-reverse',
  'law-easy-confuse',
  'law-compound-law',
  'law-distributive-trap',
  'law-error-diagnose',
] as const;

const BRACKET_TAGS = [
  'bracket-remove-plus',
  'bracket-remove-minus',
  'bracket-add',
  'bracket-division-property',
  'bracket-four-items-sign',
  'bracket-error-diagnose',
] as const;

describe('v0.4 Phase 2 A07-owned knowledge generators', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('multi-step advance subtype entries keep the original A07 practice pool', () => {
    const lowTags = getSubtypeEntries(2).map(e => e.tag);
    const highLowTags = getSubtypeEntries(5).map(e => e.tag);

    expect(lowTags).toEqual(['bracket-normal', 'extract-factor', 'decimal-two-step']);
    expect(highLowTags).toEqual(['bracket-normal', 'extract-factor', 'decimal-two-step']);
    expect([...lowTags, ...highLowTags].some(tag => tag.startsWith('law-'))).toBe(false);
    expect([...lowTags, ...highLowTags].some(tag => tag.startsWith('bracket-remove'))).toBe(false);
  });

  it('only A07 knowledge filters build law/bracket knowledge entries', () => {
    expect(usesA07KnowledgeEntries(['bracket-normal', 'extract-factor', 'decimal-two-step'])).toBe(false);
    expect(usesA07KnowledgeEntries(['bracket-hard', 'bracket-demon'])).toBe(false);

    expect(usesA07KnowledgeEntries(['law-identify'])).toBe(true);
    expect(usesA07KnowledgeEntries(['bracket-remove-plus'])).toBe(true);
    expect(usesA07KnowledgeEntries(['bracket-add'])).toBe(true);
    expect(usesA07KnowledgeEntries(['bracket-division-property'])).toBe(true);
    expect(usesA07KnowledgeEntries(['bracket-four-items-sign'])).toBe(true);
    expect(usesA07KnowledgeEntries(['bracket-error-diagnose'])).toBe(true);
  });

  it('A07 simplification diagnosis uses a namespaced subtype', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValue(0);

    const q = generateQuestion('multi-step', 8, ['bracket-demon']);

    expect(q.topicId).toBe('multi-step');
    expect(q.data.kind).toBe('multi-step');
    expect(q.data.subtype).toBe('simplify-error-diagnose');
    expect(q.data.subtype).not.toBe('error-diagnose');
  });

  it.each([...LAW_TAGS, ...BRACKET_TAGS])('%s generates as A07 multi-step identity', (tag) => {
    const q = generateQuestion('multi-step', 5, [tag]);

    expect(q.topicId).toBe('multi-step');
    expect(q.data.kind).toBe('multi-step');
    expect(q.data.subtype).toBe(tag);
    expect(q.prompt).toBeTruthy();
    expect(q.solution.answer).not.toBeUndefined();
    if ('options' in q.data && q.data.options) {
      expect(q.data.options.length).toBeGreaterThanOrEqual(3);
      expect(q.data.options.length).toBeLessThanOrEqual(4);
    }
  });

  it('A07 knowledge questions never write legacy topic ids or legacy data kinds', () => {
    for (const tag of [...LAW_TAGS, ...BRACKET_TAGS]) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion('multi-step', i < 5 ? 2 : 5, [tag]);
        expect(q.topicId).not.toBe('operation-laws');
        expect(q.topicId).not.toBe('bracket-ops');
        expect(q.data.kind).not.toBe('operation-laws');
        expect(q.data.kind).not.toBe('bracket-ops');
      }
    }
  });
});
