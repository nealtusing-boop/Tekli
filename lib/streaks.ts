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

function buildWeekMap(
  strengthLogs: StrengthLogForStreak[],
  conditioningLogs: ConditioningLogForStreak[],
  userId: string
) {
  const weekMap: Record<string, WeekStatus> = {};

  function ensureWeek(weekStartDate: string) {
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

  for (const log of strengthLogs) {
    if (log.user_id !== userId) continue;

    ensureWeek(log.week_start_date);

    if (log.workout_day === "tuesday") {
      weekMap[log.week_start_date].tuesdayStrength = true;
    }

    if (log.workout_day === "thursday") {
      weekMap[log.week_start_date].thursdayStrength = true;
    }
  }

  for (const log of conditioningLogs) {
    if (log.user_id !== userId) continue;

    ensureWeek(log.week_start_date);

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

function isWeekComplete(week: WeekStatus) {
  const mondayComplete = week.mondayRun;
  const tuesdayComplete = week.tuesdayStrength && week.amrap1;
  const wednesdayComplete = week.murph;
  const thursdayComplete = week.thursdayStrength && week.amrap2;
  const fridayComplete = week.ruck;

  return (
    mondayComplete &&
    tuesdayComplete &&
    wednesdayComplete &&
    thursdayComplete &&
    fridayComplete
  );
}

/**
 * Returns streak in DAYS.
 *
 * Important:
 * - A full week only counts if all 5 scheduled training days are logged.
 * - Tuesday only counts if Tuesday Strength + AMRAP #1 are both logged.
 * - Thursday only counts if Thursday Strength + AMRAP #2 are both logged.
 * - Each completed week adds 5 days to the streak.
 */
export function calculateCurrentStreak(
  strengthLogs: StrengthLogForStreak[],
  conditioningLogs: ConditioningLogForStreak[],
  userId: string
) {
  const weekMap = buildWeekMap(strengthLogs, conditioningLogs, userId);
  const currentWeek = getWeekStartDate();

  let cursor = currentWeek;
  let completedWeeks = 0;

  while (weekMap[cursor] && isWeekComplete(weekMap[cursor])) {
    completedWeeks += 1;
    cursor = subtractOneWeek(cursor);
  }

  if (completedWeeks === 0) {
    let previousWeek = subtractOneWeek(currentWeek);

    while (weekMap[previousWeek] && isWeekComplete(weekMap[previousWeek])) {
      completedWeeks += 1;
      previousWeek = subtractOneWeek(previousWeek);
    }
  }

  return completedWeeks * 5;
}