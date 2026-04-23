/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import {
  getDocumentTitle,
  getHeartsAriaLabel,
  getPracticeFeedbackAnnouncement,
} from './ui-accessibility';

describe('ui accessibility helpers', () => {
  it('按页面返回对应标题', () => {
    expect(getDocumentTitle('home')).toBe('数学大冒险 · 学习');
    expect(getDocumentTitle('campaign-map')).toBe('数学大冒险 · 闯关');
    expect(getDocumentTitle('session-detail')).toBe('数学大冒险 · 练习详情');
    expect(getDocumentTitle('login' as never)).toBe('数学大冒险 · 登录');
    expect(getDocumentTitle('onboarding')).toBe('数学大冒险');
  });

  it('生成心数 aria-label', () => {
    expect(getHeartsAriaLabel(3)).toBe('剩余生命 3 颗，共 3 颗');
    expect(getHeartsAriaLabel(1)).toBe('剩余生命 1 颗，共 3 颗');
    expect(getHeartsAriaLabel(0)).toBe('剩余生命 0 颗，共 3 颗');
  });

  it('生成答题反馈播报文案', () => {
    expect(getPracticeFeedbackAnnouncement(true, '42')).toBe('回答正确。正确答案是 42。');
    expect(getPracticeFeedbackAnnouncement(false, '3...1')).toBe('回答错误。正确答案是 3...1。');
    expect(getPracticeFeedbackAnnouncement(null, '42')).toBe('');
  });
});
