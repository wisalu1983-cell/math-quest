import { describe, expect, it } from 'vitest';
import {
  LEGACY_TOPIC_IDS,
  PLAYER_TOPICS,
  TOPICS,
  getPlayerTopicId,
  getTopicDisplayName,
  isLegacyTopic,
  isPlayerVisibleTopic,
} from './index';
import type { TopicId } from '@/types';

const HIDDEN_TOPICS: TopicId[] = ['operation-laws', 'bracket-ops'];

describe('v0.4 Phase 2 player-visible topics', () => {
  it('TOPICS is the six-topic player-visible list', () => {
    expect(TOPICS.map(t => t.id)).toEqual([
      'mental-arithmetic',
      'number-sense',
      'vertical-calc',
      'decimal-ops',
      'multi-step',
      'equation-transpose',
    ]);
    expect(PLAYER_TOPICS).toBe(TOPICS);
    for (const topicId of HIDDEN_TOPICS) {
      expect(TOPICS.some(t => t.id === topicId)).toBe(false);
    }
  });

  it('legacy topic guards route A04/A06 to A07 for display compatibility', () => {
    expect(LEGACY_TOPIC_IDS).toEqual(['operation-laws', 'bracket-ops']);

    expect(isLegacyTopic('operation-laws')).toBe(true);
    expect(isLegacyTopic('bracket-ops')).toBe(true);
    expect(isLegacyTopic('multi-step')).toBe(false);

    expect(isPlayerVisibleTopic('operation-laws')).toBe(false);
    expect(isPlayerVisibleTopic('bracket-ops')).toBe(false);
    expect(isPlayerVisibleTopic('multi-step')).toBe(true);

    expect(getPlayerTopicId('operation-laws')).toBe('multi-step');
    expect(getPlayerTopicId('bracket-ops')).toBe('multi-step');
    expect(getPlayerTopicId('decimal-ops')).toBe('decimal-ops');

    expect(getTopicDisplayName('operation-laws')).toBe('简便计算 · 运算律');
    expect(getTopicDisplayName('bracket-ops')).toBe('简便计算 · 括号变换');
    expect(getTopicDisplayName('multi-step')).toBe('简便计算');
  });
});
