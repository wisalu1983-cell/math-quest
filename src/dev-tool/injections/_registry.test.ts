// F3 · 注入项注册表静态断言（id / group / run）

import { describe, it, expect } from 'vitest';
import type { DevInjectionGroup } from '../types';
import { allInjections } from './_registry';

const LEGAL_GROUPS: DevInjectionGroup[] = [
  'campaign',
  'advance',
  'rank',
  'in-game',
  'navigation',
  'ext',
];

describe('allInjections（_registry）', () => {
  it('所有 id 全局唯一', () => {
    const ids = allInjections.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('所有 group 属于合法枚举', () => {
    for (const inj of allInjections) {
      expect(LEGAL_GROUPS).toContain(inj.group);
    }
  });

  it('所有 run 为函数', () => {
    for (const inj of allInjections) {
      expect(typeof inj.run).toBe('function');
    }
  });

  it('每条注入项具备最小展示字段', () => {
    for (const inj of allInjections) {
      expect(inj.label.length).toBeGreaterThan(0);
      expect(inj.description.length).toBeGreaterThan(0);
    }
  });
});
