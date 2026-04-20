// src/dev-tool/injections/_registry.ts
// F3 注入项聚合注册（声明式清单 · 设计决策 D1）
//
// 新增一组注入项时：
//   1. 在本目录下新增 <group>.ts，导出 `export const <group>Injections: DevInjection[]`
//   2. 在下方 allInjections 里 spread 进来
// 不应在其它层 import 各分组文件；统一从 `_registry` 读取。

import type { DevInjection } from '../types';
import { campaignInjections } from './campaign';
import { advanceInjections } from './advance';
import { rankProgressInjections } from './rank-progress';
import { rankActiveSessionInjections } from './rank-active-session';
import { inGameInjections } from './in-game';
import { navigationInjections } from './navigation';

export const allInjections: DevInjection[] = [
  ...campaignInjections,
  ...advanceInjections,
  ...rankProgressInjections,
  ...rankActiveSessionInjections,
  ...inGameInjections,
  ...navigationInjections,
];
