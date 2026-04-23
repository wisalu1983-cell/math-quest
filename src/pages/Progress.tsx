import { useState } from 'react';
import { repository } from '@/repository/local';
import { useGameProgressStore, useUIStore } from '@/store';
import BottomNav from '@/components/BottomNav';
import {
  filterAndSortHistory,
  getHistoryDurationMs,
  getHistoryModeLabel,
  getHistoryResultLabel,
  getHistoryStats,
  getHistoryTimeFilterLabel,
  HISTORY_MODE_OPTIONS,
  HISTORY_TIME_OPTIONS,
  resolveHistoryDateRange,
  toHistoryDateValue,
  type HistoryDateRange,
  type HistoryModeFilter,
  type HistorySortOrder,
  type HistoryTimeFilter,
} from '@/utils/history';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${h}:${m}`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}秒`;
  return `${Math.floor(sec / 60)}分${sec % 60}秒`;
}

function parseDateValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValueLabel(value: string | null): string {
  if (!value) return '—';
  const date = parseDateValue(value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthLabel(viewMonth: Date): string {
  return `${viewMonth.getFullYear()} 年 ${viewMonth.getMonth() + 1} 月`;
}

function shiftMonth(viewMonth: Date, offset: number): Date {
  return new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1);
}

function getResultClasses(result: ReturnType<typeof repository.getHistory>[number]['result']): string {
  switch (result) {
    case 'win':
      return 'border-success/25 bg-success/10 text-success';
    case 'lose':
      return 'border-danger/20 bg-danger/10 text-danger';
    case 'incomplete':
    default:
      return 'border-border-2 bg-card-2 text-text-2';
  }
}

function getModeClasses(mode: ReturnType<typeof repository.getHistory>[number]['sessionMode']): string {
  switch (mode) {
    case 'campaign':
      return 'bg-primary-lt text-primary';
    case 'advance':
      return 'bg-warning/15 text-warning';
    case 'rank-match':
      return 'bg-card-2 text-text';
    default:
      return 'bg-card-2 text-text-2';
  }
}

function buildCalendarDays(
  viewMonth: Date,
  selectedRange: ReturnType<typeof resolveHistoryDateRange>,
): Array<{
  dateValue: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
}> {
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const dateValue = toHistoryDateValue(date);
    const startDate = selectedRange.startDate;
    const endDate = selectedRange.endDate;

    return {
      dateValue,
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === viewMonth.getMonth(),
      isRangeStart: startDate === dateValue,
      isRangeEnd: endDate === dateValue,
      isInRange: Boolean(startDate && endDate && dateValue >= startDate && dateValue <= endDate),
    };
  });
}

function pickNextDateRange(previous: HistoryDateRange, dateValue: string): HistoryDateRange {
  if (!previous.startDate || previous.endDate) {
    return { startDate: dateValue, endDate: null };
  }

  if (dateValue < previous.startDate) {
    return { startDate: dateValue, endDate: previous.startDate };
  }

  return { startDate: previous.startDate, endDate: dateValue };
}

function OverviewStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-[18px] bg-card/78 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[26px] font-black leading-none text-text">{value}</span>
        <span className="text-[12px] font-bold leading-none text-text-2">{label}</span>
      </div>
    </div>
  );
}

function HistoryListSection() {
  const setPage = useUIStore(s => s.setPage);
  const setViewingSessionId = useUIStore(s => s.setViewingSessionId);
  const [modeFilter, setModeFilter] = useState<HistoryModeFilter>('all');
  const [timeFilter, setTimeFilter] = useState<HistoryTimeFilter>('all');
  const [dateRange, setDateRange] = useState<HistoryDateRange>({ startDate: null, endDate: null });
  const [draftTimeFilter, setDraftTimeFilter] = useState<HistoryTimeFilter>('all');
  const [draftDateRange, setDraftDateRange] = useState<HistoryDateRange>({ startDate: null, endDate: null });
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('desc');
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const allRecords = repository.getHistory();
  const records = filterAndSortHistory(allRecords, { modeFilter, timeFilter, dateRange, sortOrder });
  const draftResolvedRange = resolveHistoryDateRange(draftTimeFilter, draftDateRange);
  const calendarDays = buildCalendarDays(calendarMonth, draftResolvedRange);

  const openDatePanel = () => {
    setDraftTimeFilter(timeFilter);
    setDraftDateRange(dateRange);

    const resolved = resolveHistoryDateRange(timeFilter, dateRange);
    const pivotDate = resolved.endDate ?? resolved.startDate;
    if (pivotDate) {
      const date = parseDateValue(pivotDate);
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      setCalendarMonth(new Date());
    }

    setIsDatePanelOpen(true);
  };

  const applyDateRange = () => {
    if (draftTimeFilter === 'custom' && !draftResolvedRange.startDate) {
      return;
    }

    setTimeFilter(draftTimeFilter);
    setDateRange({
      startDate: draftResolvedRange.startDate,
      endDate: draftResolvedRange.endDate,
    });
    setIsDatePanelOpen(false);
  };

  const handleQuickRangeSelect = (filter: HistoryTimeFilter) => {
    setDraftTimeFilter(filter);

    if (filter === 'custom') {
      return;
    }

    setDraftDateRange({ startDate: null, endDate: null });
    const resolved = resolveHistoryDateRange(filter, { startDate: null, endDate: null });
    if (resolved.endDate) {
      const date = parseDateValue(resolved.endDate);
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handleCalendarDateClick = (dateValue: string) => {
    setDraftTimeFilter('custom');
    setDraftDateRange(previous => pickNextDateRange(previous, dateValue));
  };

  const handleViewDetail = (sessionId: string) => {
    setViewingSessionId(sessionId);
    setPage('session-detail');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {HISTORY_MODE_OPTIONS.map(option => {
          const active = option.value === modeFilter;
          return (
            <button
              key={option.value}
              onClick={() => setModeFilter(option.value)}
              className={`rounded-full px-3 py-2 text-xs font-black transition-colors ${
                active
                  ? 'bg-text text-card'
                  : 'border border-border-2 bg-card text-text-2 hover:text-text'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openDatePanel}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
              isDatePanelOpen || timeFilter !== 'all'
                ? 'border-primary/30 bg-primary-lt text-primary'
                : 'border-border-2 bg-card text-text-2 hover:text-text'
            }`}
          >
            {getHistoryTimeFilterLabel(timeFilter, dateRange)}
          </button>

          <button
            onClick={() => setSortOrder(current => (current === 'desc' ? 'asc' : 'desc'))}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
              sortOrder === 'desc'
                ? 'border-border-2 bg-card text-text-2 hover:text-text'
                : 'border-primary/30 bg-primary-lt text-primary'
            }`}
          >
            时间排序：{sortOrder === 'desc' ? '倒序' : '正序'}
          </button>
        </div>

        {isDatePanelOpen ? (
          <section
            className="absolute right-0 top-[calc(100%+10px)] z-20 w-full max-w-[360px] overflow-hidden rounded-[28px] border border-border bg-card/95 p-4 shadow-[0_18px_40px_rgba(108,68,39,0.16)] backdrop-blur-sm"
            aria-label="时间筛选浮窗"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-text">时间范围筛选</h3>
                <p className="mt-1 text-[11px] leading-5 text-text-2">
                  先点快捷范围，再用日历选某一天或一个日期范围。
                </p>
              </div>
              <button
                onClick={() => setIsDatePanelOpen(false)}
                aria-label="关闭时间筛选"
                className="h-8 w-8 rounded-full bg-card-2 text-lg text-text-2 transition-colors hover:text-text"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {HISTORY_TIME_OPTIONS.map(option => {
                const active = option.value === draftTimeFilter;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleQuickRangeSelect(option.value)}
                    className={`rounded-full border px-3 py-2 text-xs font-black transition-colors ${
                      active
                        ? 'border-primary/30 bg-primary-lt text-primary'
                        : 'border-border-2 bg-card text-text-2 hover:text-text'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-[24px] border border-border-2 bg-card-2/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-text">{getMonthLabel(calendarMonth)}</strong>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarMonth(current => shiftMonth(current, -1))}
                    aria-label="上个月"
                    className="h-8 w-8 rounded-full bg-card text-sm text-text-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-colors hover:text-text"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCalendarMonth(current => shiftMonth(current, 1))}
                    aria-label="下个月"
                    className="h-8 w-8 rounded-full bg-card text-sm text-text-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-colors hover:text-text"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
                {['一', '二', '三', '四', '五', '六', '日'].map(day => (
                  <span key={day} className="py-1 text-[10px] font-bold tracking-[0.12em] text-text-2">
                    {day}
                  </span>
                ))}

                {calendarDays.map(day => {
                  const highlighted = day.isRangeStart || day.isRangeEnd;
                  return (
                    <button
                      key={day.dateValue}
                      onClick={() => handleCalendarDateClick(day.dateValue)}
                      className={`min-h-9 rounded-2xl text-xs font-bold transition-colors ${
                        highlighted
                          ? 'bg-primary text-card'
                          : day.isInRange
                            ? 'bg-primary-lt text-primary'
                            : day.inCurrentMonth
                              ? 'bg-card text-text hover:text-primary'
                              : 'bg-transparent text-text-2/60'
                      }`}
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-[11px] leading-5 text-text-2">
                  <div>开始：{formatDateValueLabel(draftResolvedRange.startDate)}</div>
                  <div>结束：{formatDateValueLabel(draftResolvedRange.endDate)}</div>
                </div>
                <button
                  onClick={applyDateRange}
                  disabled={draftTimeFilter === 'custom' && !draftResolvedRange.startDate}
                  className="rounded-full bg-text px-4 py-2 text-xs font-black text-card transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  应用时间范围
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-base font-black text-text">练习记录</h2>
        <span className="text-xs font-bold text-text-2">{records.length} 条</span>
      </div>

      {allRecords.length === 0 ? (
        <div className="rounded-[28px] border-2 border-dashed border-border-2 bg-card px-6 py-14 text-center">
          <p className="text-base font-black text-text">还没有练习记录</p>
          <p className="mt-2 text-sm text-text-2">完成任意一局后，这里会自动留下完整记录。</p>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-[28px] border-2 border-border-2 bg-card px-6 py-12 text-center">
          <p className="text-base font-black text-text">当前筛选下没有记录</p>
          <p className="mt-2 text-sm text-text-2">换个模式或调整时间范围再看看。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(record => {
            const stats = getHistoryStats(record);
            const duration = formatDuration(getHistoryDurationMs(record));

            return (
              <button
                key={record.id}
                onClick={() => handleViewDetail(record.id)}
                className="w-full overflow-hidden rounded-[28px] border-2 border-border-2 bg-card p-4 text-left transition-transform transition-colors hover:-translate-y-0.5 hover:border-primary/35"
                style={{
                  boxShadow: '0 1px 6px rgba(0,0,0,.06)',
                  contentVisibility: 'auto',
                  containIntrinsicSize: '220px',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${getModeClasses(record.sessionMode)}`}>
                      {getHistoryModeLabel(record.sessionMode)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${getResultClasses(record.result)}`}>
                      {getHistoryResultLabel(record.result)}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-text-2">{formatDate(record.startedAt)}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-card-2 px-3 py-3">
                    <div className="text-lg font-black text-text">{stats.accuracy}%</div>
                    <div className="mt-1 text-[11px] font-bold text-text-2">正确率</div>
                  </div>
                  <div className="rounded-2xl bg-card-2 px-3 py-3">
                    <div className="text-lg font-black text-text">{stats.correct}/{stats.total}</div>
                    <div className="mt-1 text-[11px] font-bold text-text-2">正确/总数</div>
                  </div>
                  <div className="rounded-2xl bg-card-2 px-3 py-3">
                    <div className="text-lg font-black text-text">{duration}</div>
                    <div className="mt-1 text-[11px] font-bold text-text-2">耗时</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-text-2">
                  <span>{record.completed ? '查看逐题详情' : '查看已完成的答题轨迹'}</span>
                  <span aria-hidden="true">→</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Progress() {
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const history = repository.getHistory();

  const totalAttempts = gameProgress?.totalQuestionsAttempted ?? 0;
  const accuracy = totalAttempts > 0
    ? Math.round(((gameProgress?.totalQuestionsCorrect ?? 0) / totalAttempts) * 100)
    : 0;

  const completedCount = history.filter(record => record.completed).length;
  const winCount = history.filter(record => record.result === 'win').length;
  const winRate = completedCount > 0 ? Math.round((winCount / completedCount) * 100) : 0;

  return (
    <div className="min-h-dvh bg-bg pb-[120px] safe-top">
      <div className="sticky top-0 z-10 border-b-2 border-border-2 bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          <h1 className="text-[17px] font-black">记录</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <section
          className="overflow-hidden rounded-[30px] border-2 border-border-2 bg-card p-4"
          style={{
            boxShadow: '0 1px 10px rgba(0,0,0,.07)',
            backgroundImage: 'linear-gradient(135deg, rgba(255,244,229,.96) 0%, rgba(255,255,255,.95) 54%, rgba(238,247,255,.98) 100%)',
          }}
        >
          <div className="text-[22px] font-black leading-none text-text">概览信息</div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <OverviewStat value={totalAttempts} label="累计答题" />
            <OverviewStat value={`${accuracy}%`} label="总正确率" />
            <OverviewStat value={completedCount} label="已完成局数" />
            <OverviewStat value={`${winRate}%`} label="胜利占比" />
          </div>
        </section>

        <HistoryListSection />
      </div>

      <BottomNav activeTab="progress" />
    </div>
  );
}
