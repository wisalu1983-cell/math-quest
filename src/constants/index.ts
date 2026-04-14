import type { TopicMeta } from '@/types';

export const TOPICS: TopicMeta[] = [
  { id: 'mental-arithmetic', name: '基础计算', description: '整数口算与运算顺序训练', icon: '⚡', color: '#1cb0f6', unlockLevel: 0 },
  { id: 'number-sense', name: '数感估算', description: '培养数字感觉和估算能力', icon: '🎯', color: '#58cc02', unlockLevel: 0 },
  { id: 'vertical-calc', name: '竖式笔算', description: '进位退位逐步练习', icon: '📝', color: '#ff9600', unlockLevel: 0 },
  { id: 'operation-laws', name: '运算律', description: '交换律、结合律、分配律', icon: '🔄', color: '#ce82ff', unlockLevel: 0 },
  { id: 'decimal-ops', name: '小数计算', description: '小数加减乘除运算', icon: '🔢', color: '#ff4b4b', unlockLevel: 0 },
  { id: 'bracket-ops', name: '括号变换', description: '增减括号与符号变换', icon: '🔗', color: '#ffc800', unlockLevel: 0 },
  { id: 'multi-step', name: '简便计算', description: '运用运算律和技巧简化计算', icon: '📊', color: '#2b70c9', unlockLevel: 0 },
  { id: 'equation-transpose', name: '方程移项', description: '方程式解题与移项', icon: '⚖️', color: '#00cd9c', unlockLevel: 0 },
];

export type DifficultyTier = 'normal' | 'hard' | 'demon';

export const DIFFICULTY_TIERS: { id: DifficultyTier; label: string; icon: string; value: number; description: string }[] = [
  { id: 'normal', label: '普通', icon: '😊', value: 5, description: '五年级毕业标准，打好根基' },
  { id: 'hard', label: '困难', icon: '😤', value: 7, description: '小升初提高题，需要动脑' },
  { id: 'demon', label: '魔王', icon: '👹', value: 10, description: '竞赛拓展级，计算高手专属' },
];

/** 闯关最大心数（固定 3） */
export const CAMPAIGN_MAX_HEARTS = 3;
