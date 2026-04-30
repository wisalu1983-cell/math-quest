import { createElement } from 'react';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DevDrawer from './DevDrawer';
import DevFab from './DevFab';
import QuestionBrowserPanel from './QuestionBrowserPanel';

describe('DevFab', () => {
  it('右上角并列暴露 DEV 与题型入口', () => {
    const html = renderToStaticMarkup(createElement(DevFab));

    expect(html).toContain('aria-label="打开 DEV 工具抽屉"');
    expect(html).toContain('aria-label="打开题型一览面板"');
    expect(html).toContain('top-20');
    expect(html).toContain('right-4');
    expect(html).toContain('gap-2');
  });

  it('DevDrawer 不再内联题型入口', () => {
    const html = renderToStaticMarkup(createElement(DevDrawer, { onClose: () => {} }));

    expect(html).not.toContain('打开题型一览面板');
  });

  it('题型展示面板打开时使用上一次选择的题型', () => {
    const html = renderToStaticMarkup(
      createElement(QuestionBrowserPanel, {
        namespace: 'dev',
        onClose: () => {},
        onLog: () => {},
        initialTopicId: 'vertical-calc',
        initialSubtypeId: 'vertical-calc.long-division.decimal-divisor',
      } as ComponentProps<typeof QuestionBrowserPanel>),
    );

    expect(html).toContain('竖式笔算');
    expect(html).toContain('小数÷小数扩倍');
    expect(html).toContain('dec-div');
  });
});
