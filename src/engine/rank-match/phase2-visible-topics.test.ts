import { describe, expect, it } from 'vitest';
import {
  RANK_ENTRY_STARS,
  RANK_PRIMARY_BY_WIN_SLOT,
  RANK_REVIEW_TOPIC_RANGE,
  RANK_TOPIC_RANGE,
  type ChallengeableTier,
} from '@/constants/rank-match';
import { getTierGaps } from './entry-gate';
import type { AdvanceProgress } from '@/types/gamification';

const HIDDEN = ['operation-laws', 'bracket-ops'];
const TIERS = ['rookie', 'pro', 'expert', 'master'] as ChallengeableTier[];

function flatten<T>(nested: T[][]): T[] {
  return nested.flatMap(items => items);
}

describe('v0.4 Phase 2 rank match visible topics', () => {
  it('entry gates, topic ranges, review ranges, and primary schedules exclude hidden topics', () => {
    for (const tier of TIERS) {
      const entryTopics = Object.keys(RANK_ENTRY_STARS[tier]);
      const topicRange = RANK_TOPIC_RANGE[tier];
      const reviewRange = RANK_REVIEW_TOPIC_RANGE[tier];
      const primaryTopics = flatten(RANK_PRIMARY_BY_WIN_SLOT[tier]);

      for (const hidden of HIDDEN) {
        expect(entryTopics).not.toContain(hidden);
        expect(topicRange).not.toContain(hidden);
        expect(reviewRange).not.toContain(hidden);
        expect(primaryTopics).not.toContain(hidden);
      }
    }
  });

  it('rank gate gaps do not ask for old A04/A06 stars even if legacy progress exists', () => {
    const advanceProgress: AdvanceProgress = {
      'operation-laws': {
        topicId: 'operation-laws',
        heartsAccumulated: 0,
        sessionsPlayed: 0,
        sessionsWhite: 0,
        unlockedAt: 1,
      },
      'bracket-ops': {
        topicId: 'bracket-ops',
        heartsAccumulated: 0,
        sessionsPlayed: 0,
        sessionsWhite: 0,
        unlockedAt: 1,
      },
    };

    for (const tier of TIERS) {
      const gaps = getTierGaps(tier, advanceProgress);
      expect(gaps.map(g => g.topicId)).not.toContain('operation-laws');
      expect(gaps.map(g => g.topicId)).not.toContain('bracket-ops');
    }
  });
});
