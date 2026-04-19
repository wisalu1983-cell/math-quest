import { describe, it, expect } from 'vitest';
import { decideRankMatchRecovery } from './recovery-policy';

describe('decideRankMatchRecovery', () => {
  it('active + unfinished game -> auto-resume-practice', () => {
    expect(decideRankMatchRecovery({
      status: 'active',
      hasUnfinishedGame: true,
    })).toBe('auto-resume-practice');
  });

  it('active + no unfinished game -> stay-home', () => {
    expect(decideRankMatchRecovery({
      status: 'active',
      hasUnfinishedGame: false,
    })).toBe('stay-home');
  });

  it('suspended + unfinished game -> stay-home', () => {
    expect(decideRankMatchRecovery({
      status: 'suspended',
      hasUnfinishedGame: true,
    })).toBe('stay-home');
  });

  it('completed / cancelled -> clear-and-ignore', () => {
    expect(decideRankMatchRecovery({
      status: 'completed',
      hasUnfinishedGame: false,
    })).toBe('clear-and-ignore');

    expect(decideRankMatchRecovery({
      status: 'cancelled',
      hasUnfinishedGame: true,
    })).toBe('clear-and-ignore');
  });
});
