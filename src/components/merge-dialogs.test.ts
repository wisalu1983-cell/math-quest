import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AccountMismatchDialog from './AccountMismatchDialog';
import MergeGuideDialog from './MergeGuideDialog';

const noop = vi.fn();

describe('MergeGuideDialog', () => {
  it('两端都有进度时只提供合并到云端、使用云端、取消登录三个明确选择', () => {
    const html = renderToStaticMarkup(createElement(MergeGuideDialog, {
      step: 'wait-user-choice',
      onConfirmMerge: noop,
      onConfirmDiscard: noop,
      onRetry: noop,
      onSwitch: noop,
      onCancelLogin: noop,
    }));

    expect(html).toContain('发现本地进度');
    expect(html).toContain('合并到云端');
    expect(html).toContain('使用云端');
    expect(html).toContain('取消登录');
    expect(html).not.toContain('稍后再说');
  });

  it('首次登录离线时提示需要网络并允许重试或取消登录', () => {
    const html = renderToStaticMarkup(createElement(MergeGuideDialog, {
      step: 'offline-waiting',
      onConfirmMerge: noop,
      onConfirmDiscard: noop,
      onRetry: noop,
      onSwitch: noop,
      onCancelLogin: noop,
    }));

    expect(html).toContain('首次登录需要网络');
    expect(html).toContain('完成一次同步后即可离线使用');
    expect(html).toContain('重试');
    expect(html).toContain('取消登录');
  });
});

describe('AccountMismatchDialog', () => {
  it('归属冲突时说明不会把旧账号进度迁移到新账号', () => {
    const html = renderToStaticMarkup(createElement(AccountMismatchDialog, {
      currentLocalAuthId: 'account-a',
      incomingUserId: 'account-b',
      onProceed: noop,
      onCancelLogin: noop,
    }));

    expect(html).toContain('本设备已绑定另一个账号');
    expect(html).toContain('不会迁移到新账号');
    expect(html).toContain('account-b');
    expect(html).toContain('继续登录');
    expect(html).toContain('取消登录');
  });
});
