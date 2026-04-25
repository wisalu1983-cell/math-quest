import type { LegacyTopicId, PlayerVisibleTopicId, TopicId, TopicMeta } from '@/types';

export const LEGACY_TOPIC_IDS = ['operation-laws', 'bracket-ops'] as const satisfies readonly LegacyTopicId[];

const TOPIC_META_BY_ID: Record<TopicId, TopicMeta> = {
  'mental-arithmetic': { id: 'mental-arithmetic', name: '基础计算', description: '整数口算与运算顺序训练', icon: '⚡', color: '#FF6B35', unlockLevel: 0 },
  'number-sense': { id: 'number-sense', name: '数感估算', description: '培养数字感觉和估算能力', icon: '🎯', color: '#3DBF6E', unlockLevel: 0 },
  'vertical-calc': { id: 'vertical-calc', name: '竖式笔算', description: '进位退位逐步练习', icon: '📝', color: '#FF922B', unlockLevel: 0 },
  'operation-laws': { id: 'operation-laws', name: '运算律', description: '交换律、结合律、分配律', icon: '🔄', color: '#9B59B6', unlockLevel: 0 },
  'decimal-ops': { id: 'decimal-ops', name: '小数计算', description: '小数加减乘除运算', icon: '🔢', color: '#E74C3C', unlockLevel: 0 },
  'bracket-ops': { id: 'bracket-ops', name: '括号变换', description: '增减括号与符号变换', icon: '🔗', color: '#E6AC00', unlockLevel: 0 },
  'multi-step': { id: 'multi-step', name: '简便计算', description: '运用运算律和技巧简化计算', icon: '📊', color: '#2980B9', unlockLevel: 0 },
  'equation-transpose': { id: 'equation-transpose', name: '方程移项', description: '方程式解题与移项', icon: '⚖️', color: '#1ABC9C', unlockLevel: 0 },
};

export const ALL_TOPICS: TopicMeta[] = [
  TOPIC_META_BY_ID['mental-arithmetic'],
  TOPIC_META_BY_ID['number-sense'],
  TOPIC_META_BY_ID['vertical-calc'],
  TOPIC_META_BY_ID['operation-laws'],
  TOPIC_META_BY_ID['decimal-ops'],
  TOPIC_META_BY_ID['bracket-ops'],
  TOPIC_META_BY_ID['multi-step'],
  TOPIC_META_BY_ID['equation-transpose'],
];

export const PLAYER_TOPICS: Array<TopicMeta & { id: PlayerVisibleTopicId }> = [
  TOPIC_META_BY_ID['mental-arithmetic'],
  TOPIC_META_BY_ID['number-sense'],
  TOPIC_META_BY_ID['vertical-calc'],
  TOPIC_META_BY_ID['decimal-ops'],
  TOPIC_META_BY_ID['multi-step'],
  TOPIC_META_BY_ID['equation-transpose'],
] as Array<TopicMeta & { id: PlayerVisibleTopicId }>;

export const TOPICS = PLAYER_TOPICS;

export function isLegacyTopic(topicId: TopicId): topicId is LegacyTopicId {
  return (LEGACY_TOPIC_IDS as readonly TopicId[]).includes(topicId);
}

export function isPlayerVisibleTopic(topicId: TopicId): topicId is PlayerVisibleTopicId {
  return !isLegacyTopic(topicId);
}

export function getPlayerTopicId(topicId: TopicId): PlayerVisibleTopicId {
  return isLegacyTopic(topicId) ? 'multi-step' : topicId;
}

export function getTopicMeta(topicId: TopicId): TopicMeta {
  return TOPIC_META_BY_ID[getPlayerTopicId(topicId)];
}

export function getTopicDisplayName(topicId: TopicId): string {
  if (topicId === 'operation-laws') return '简便计算 · 运算律';
  if (topicId === 'bracket-ops') return '简便计算 · 括号变换';
  return getTopicMeta(topicId).name;
}

export type DifficultyTier = 'normal' | 'hard' | 'demon';

export const DIFFICULTY_TIERS: { id: DifficultyTier; label: string; icon: string; value: number; description: string }[] = [
  { id: 'normal', label: '普通', icon: '😊', value: 5, description: '五年级毕业标准，打好根基' },
  { id: 'hard', label: '困难', icon: '😤', value: 7, description: '小升初提高题，需要动脑' },
  { id: 'demon', label: '魔王', icon: '👹', value: 10, description: '竞赛拓展级，计算高手专属' },
];

/** 闯关最大心数（固定 3） */
export const CAMPAIGN_MAX_HEARTS = 3;
