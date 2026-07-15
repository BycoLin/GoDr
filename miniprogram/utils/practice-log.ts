import { todayKey } from './daily';

export interface DayLog {
  date: string;
  answered: number;
  sessions: number;
  cleared: number;
}

export interface TodayGoal {
  answered: number;
  rawAnswered: number;
  target: number;
  done: boolean;
  percent: number;
  barWidth: string;
  tip: string;
}

export interface WeekDayDot {
  date: string;
  label: string;
  practiced: boolean;
  answered: number;
}

export interface WeekReport {
  practiceDays: number;
  answeredTotal: number;
  clearedTotal: number;
  rangeLabel: string;
  days: WeekDayDot[];
  tip: string;
}

const LOG_KEY = 'practiceLog';
export const DAILY_GOAL_TARGET = 10;
const WEEK_DAYS = 7;
const KEEP_DAYS = 60;

/** 本周展示：周一 → 周日 */
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function emptyDay(date: string): DayLog {
  return { date, answered: 0, sessions: 0, cleared: 0 };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateKeyOffset(offset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

/** 本周一 12:00（周一为一周起点） */
function mondayOfThisWeek(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const dow = d.getDay(); // 0=日 … 6=六
  const toMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + toMonday);
  return d;
}

function loadAll(): Record<string, DayLog> {
  try {
    const data = wx.getStorageSync(LOG_KEY) as Record<string, DayLog> | '';
    if (!data || typeof data !== 'object') return {};
    return data;
  } catch {
    return {};
  }
}

function prune(all: Record<string, DayLog>): Record<string, DayLog> {
  const keepFrom = dateKeyOffset(-(KEEP_DAYS - 1));
  const next: Record<string, DayLog> = {};
  Object.keys(all).forEach((key) => {
    if (key >= keepFrom) next[key] = all[key];
  });
  return next;
}

function saveAll(all: Record<string, DayLog>): void {
  wx.setStorageSync(LOG_KEY, prune(all));
}

export function loadDayLog(date = todayKey()): DayLog {
  const all = loadAll();
  return all[date] ? { ...emptyDay(date), ...all[date] } : emptyDay(date);
}

/** 任意练习结束时记账；answered 为本局题数，clearedDelta 为本局新通关数 */
export function recordPracticeSession(
  answered: number,
  clearedDelta = 0,
): { day: DayLog; goalJustDone: boolean } {
  const date = todayKey();
  const all = loadAll();
  const prev = all[date] ? { ...emptyDay(date), ...all[date] } : emptyDay(date);
  const before = prev.answered;
  const next: DayLog = {
    date,
    answered: before + Math.max(0, Math.floor(answered) || 0),
    sessions: prev.sessions + 1,
    cleared: prev.cleared + Math.max(0, Math.floor(clearedDelta) || 0),
  };
  all[date] = next;
  saveAll(all);

  const goalJustDone = before < DAILY_GOAL_TARGET && next.answered >= DAILY_GOAL_TARGET;
  return { day: next, goalJustDone };
}

export function getTodayGoal(): TodayGoal {
  const day = loadDayLog();
  const rawAnswered = day.answered;
  const target = DAILY_GOAL_TARGET;
  const done = rawAnswered >= target;
  const answered = Math.min(rawAnswered, target);
  const percent = Math.min(100, Math.round((rawAnswered / target) * 100));
  return {
    answered,
    rawAnswered,
    target,
    done,
    percent,
    barWidth: `${percent}%`,
    tip: done
      ? rawAnswered > target
        ? `目标达成！今日已练 ${rawAnswered} 题`
        : '今日目标达成！真棒'
      : `再练 ${target - rawAnswered} 题就达成`,
  };
}

export function getWeekReport(): WeekReport {
  const days: WeekDayDot[] = [];
  let practiceDays = 0;
  let answeredTotal = 0;
  let clearedTotal = 0;
  const monday = mondayOfThisWeek();

  for (let i = 0; i < WEEK_DAYS; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = toDateKey(d);
    const log = loadDayLog(date);
    const practiced = log.sessions > 0 || log.answered > 0;
    if (practiced) practiceDays += 1;
    answeredTotal += log.answered;
    clearedTotal += log.cleared;

    days.push({
      date,
      label: WEEK_LABELS[i],
      practiced,
      answered: log.answered,
    });
  }

  let tip = '这周还没练过，打开地图闯一关吧';
  if (practiceDays > 0) {
    tip =
      practiceDays >= 5
        ? '这周练得很稳，继续保持'
        : practiceDays >= 3
          ? '节奏不错，再练几天更棒'
          : '开了个头，再多练几天就更好';
  }

  return {
    practiceDays,
    answeredTotal,
    clearedTotal,
    rangeLabel: '本周',
    days,
    tip,
  };
}

export function clearPracticeLog(): void {
  wx.removeStorageSync(LOG_KEY);
}
