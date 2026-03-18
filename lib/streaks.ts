import { getWeekStartDate, subtractOneWeek } from "./date";

type StrengthLogForStreak = {
  user_id: string;
  week_start_date: string;
  workout_day: string;
};

type ConditioningLogForStreak = {
  user_id: string;
  week_start_date: string;
  event_name: string;
};

type WeekStatus = {
  mondayRun: boolean;
  tuesdayStrength: boolean;
  amrap1: boolean;
  murph: boolean;
  thursdayStrength: boolean;
  amrap2: boolean;
  ruck: boolean;
};

function ensureWeek(
  weekMap: Record<string, WeekStatus>,
  weekStartDate: string
) {
  if (!weekMap[weekStartDate]) {
    weekMap[weekStartDate] = {
      mondayRun: false,
      tuesdayStrength: false,
      amrap1: false,
      murph: false,
      thursdayStrength: false,
      amrap2: false,
      ruck: false,
    };
  }
}

function buildWeekMap(
  strengthLogs: StrengthLogForStreak[],
  conditioningLogs: ConditioningLogForStreak[],
  userId: string
) {
  const weekMap: Record<string, WeekStatus> = {};

  for (const log of strengthLogs) {
    if (log.user_id !== userId) continue;

    ensureWeek(weekMap, log.week_start_date);

    if (log.workout_day === "tuesday") {
      weekMap[log.week_start_date].tuesdayStrength = true;
    }

    if (log.workout_day === "thursday") {
      weekMap[log.week_start_date].thursdayStrength = true;
    }
  }

  for (const log of conditioningLogs) {
    if (log.user_id !== userId) continue;

    ensureWeek(weekMap, log.week_start_date);

    if (log.event_name === "5_mile_run") {
      weekMap[log.week_start_date].mondayRun = true;
    }

    if (log.event_name === "amrap_1") {
      weekMap[log.week_start_date].amrap1 = true;
    }

    if (log.event_name === "murph") {
      weekMap[log.week_start_date].murph = true;
    }

    if (log.event_name === "amrap_2") {
      weekMap[log.week_start_date].amrap2 = true;
    }

    if (log.event_name === "ruck") {
      weekMap[log.week_start_date].ruck = true;
    }
  }

  return weekMap;
}

function getCompletedDaysForWeek(week?: WeekStatus) {
  if (!week) return 0;

  let days = 0;

  if (week.mondayRun) days += 1;
  if (week.tuesdayStrength && week.amrap1) days += 1;
  if (week.murph) days += 1;
  if (week.thursdayStrength && week.amrap2) days += 1;
  if (week.ruck) days += 1;

  return days;
}

/**
 * Streak rules:
 * - Count completed TRAINING DAYS, not weeks.
 * - Monday = 5 mile run
 * - Tuesday = strength + AMRAP #1 both required
 * - Wednesday = murph
 * - Thursday = strength + AMRAP #2 both required
 * - Friday = ruck
 *
 * Display rule:
 * - Current week's completed training days count toward the streak immediately.
 *
 * Break rule:
 * - If the PREVIOUS week exists but did not reach all 5 completed training days,
 *   the streak is broken and only the current week's completed days remain.
 * - Fully completed weeks before the current week add 5 days each until the first
 *   incomplete week is encountered.
 */
export function calculateCurrentStreak(
  strengthLogs: StrengthLogForStreak[],
  conditioningLogs: ConditioningLogForStreak[],
  userId: string
) {
  const weekMap = buildWeekMap(strengthLogs, conditioningLogs, userId);
  const currentWeek = getWeekStartDate();

  const currentWeekDays = getCompletedDaysForWeek(weekMap[currentWeek]);

  let streakDays = currentWeekDays;
  let cursor = subtractOneWeek(currentWeek);

  if (weekMap[cursor]) {
    const previousWeekDays = getCompletedDaysForWeek(weekMap[cursor]);

    if (previousWeekDays < 5) {
      return streakDays;
    }

    streakDays += 5;
    cursor = subtractOneWeek(cursor);
  } else {
    return streakDays;
  }

  while (weekMap[cursor]) {
    const days = getCompletedDaysForWeek(weekMap[cursor]);

    if (days < 5) {
      break;
    }

    streakDays += 5;
    cursor = subtractOneWeek(cursor);
  }

  return streakDays;
}