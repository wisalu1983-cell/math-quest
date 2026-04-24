import type { RankMatchSession } from '@/types/gamification';

export const TAKEOVER_THRESHOLD_MS = 10 * 60 * 1000;

export type RankMatchTakeoverState =
  | 'inactive'
  | 'local-active'
  | 'another-device-active'
  | 'stale-active-takeoverable'
  | 'suspended';

function parseUpdatedAt(updatedAt: RankMatchSession['updatedAt']): number | null {
  if (updatedAt === undefined) return null;
  const time = typeof updatedAt === 'number' ? updatedAt : Date.parse(updatedAt);
  return Number.isNaN(time) ? null : time;
}

export function getRankMatchTakeoverState(params: {
  session: RankMatchSession | null;
  startedInThisSession: Set<string>;
  now: number;
}): RankMatchTakeoverState {
  const { session, startedInThisSession, now } = params;
  if (!session || session.outcome || session.status === 'completed' || session.status === 'cancelled') {
    return 'inactive';
  }

  if (session.status === 'suspended') {
    return 'suspended';
  }

  if (startedInThisSession.has(session.id)) {
    return 'local-active';
  }

  const updatedAt = parseUpdatedAt(session.updatedAt);
  if (updatedAt === null) {
    return 'local-active';
  }

  return now - updatedAt <= TAKEOVER_THRESHOLD_MS
    ? 'another-device-active'
    : 'stale-active-takeoverable';
}

export function getTakeoverMinutesLeft(session: RankMatchSession, now: number): number {
  const updatedAt = parseUpdatedAt(session.updatedAt);
  if (updatedAt === null) return 0;
  const remaining = TAKEOVER_THRESHOLD_MS - (now - updatedAt);
  return Math.max(0, Math.ceil(remaining / 60_000));
}
