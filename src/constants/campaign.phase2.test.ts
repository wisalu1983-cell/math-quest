import { describe, expect, it } from 'vitest';
import { CAMPAIGN_MAPS, getSubtypeFilter } from './campaign';

describe('v0.4 Phase 2 A07 campaign IA', () => {
  it('A07 S1 has three low-tier lanes: laws, bracket transform, simplification basics', () => {
    const s1 = CAMPAIGN_MAPS['multi-step'].stages[0];

    expect(s1.stageId).toBe('multi-step-S1');
    expect(s1.lanes.map(l => l.laneLabel)).toEqual([
      '运算律',
      '括号变换',
      '基础简便应用',
    ]);
    expect(s1.lanes).toHaveLength(3);
    expect(s1.lanes.every(lane => lane.levels.length === 2)).toBe(true);
  });

  it('A07 S1 uses namespaced law-* and bracket-* subtype filters', () => {
    const s1 = CAMPAIGN_MAPS['multi-step'].stages[0];
    const lawTags = s1.lanes[0].subtypeFilter ?? [];
    const bracketTags = s1.lanes[1].subtypeFilter ?? [];
    const basicsTags = s1.lanes[2].subtypeFilter ?? [];

    expect(lawTags).toEqual([
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
    ]);
    expect(bracketTags).toEqual([
      'bracket-remove-plus',
      'bracket-remove-minus',
      'bracket-add',
      'bracket-division-property',
      'bracket-four-items-sign',
      'bracket-error-diagnose',
    ]);
    expect(bracketTags).not.toContain('bracket-nested');
    expect(basicsTags).toEqual(['bracket-normal', 'extract-factor', 'decimal-two-step']);

    const allA07Tags = CAMPAIGN_MAPS['multi-step'].stages.flatMap(stage =>
      stage.lanes.flatMap(lane => lane.subtypeFilter ?? []),
    );
    expect(allA07Tags).not.toContain('error-diagnose');
    expect(allA07Tags).not.toContain('identify-law');
    expect(allA07Tags).not.toContain('remove-bracket-minus');
  });

  it('getSubtypeFilter exposes the new A07 lane filters to real campaign sessions', () => {
    expect(getSubtypeFilter('multi-step', 'multi-step-S1-LA-L1')).toEqual([
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
    ]);
    expect(getSubtypeFilter('multi-step', 'multi-step-S1-LB-L2')).toEqual([
      'bracket-remove-plus',
      'bracket-remove-minus',
      'bracket-add',
      'bracket-division-property',
      'bracket-four-items-sign',
      'bracket-error-diagnose',
    ]);
    expect(getSubtypeFilter('multi-step', 'multi-step-S1-LC-L2')).toEqual(['bracket-normal', 'extract-factor', 'decimal-two-step']);
  });
});
