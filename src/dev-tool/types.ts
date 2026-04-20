// src/dev-tool/types.ts
// F3 开发者工具栏（v0.2-1-1）· 注入项类型定义

export type DevInjectionGroup =
  | 'campaign'
  | 'advance'
  | 'rank'
  | 'in-game'
  | 'navigation'
  | 'ext';

export interface DevInjection {
  id: string;
  group: DevInjectionGroup;
  label: string;
  description: string;
  run(): Promise<void> | void;
}
