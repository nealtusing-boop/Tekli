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

function getCompletedWeekSet(
  strengthLogs: StrengthLogForStreak[],
  conditioningLogs: ConditioningLogForStreak[],
  userId: string
) {
  const weekMap: Record<
    string,
    {
      tuesdayStrength: boolean;
      thursdayStrength: boolean;
      mondayRun: boolean;
      murph: boolean;
      ruck: boolean;
      amrap1: boolean;
      amrap2: boolean;
    }
  > = {};

  const ensureWeek = (week: string) => {
    if (!weekMap[week]) {
      weekMap[week] = {
        tuesdayStrength: false,
        thursdayStrength: false,
        mondayRun: false,
        murph: false,
        ruck: false,
        amrap1: false,
        amrap2: false,
      };
    }
  };

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

    if (log.event_name === "murph") {
      weekMap[log.week_start_date].murph = true;
    }

    if (log.event_name === "ruck") {
      weekMap[log.week_start_date].ruck = true;
    }

    if (log.event_name === "amrap_1") {
      weekMap[log.week_start_date].amrap1 = true;
    }

    if (log.event_name === "amrap_2") {
      weekMap[log.week_start_date].amrap2 = true;
    }
  }

  const completedWeeks = new Set<string>();

  for (const weekStartDate of Object.keys(weekMap)) {
    const week = weekMap[weekStartDate];

    const isComplete =
      week.mondayRun &&
      week.tuesdayStrength &&
      week.amrap1 &&
      week.murph &&
      week.thursdayStrength &&
      week.amrap2 &&
      week.ruck;

    if (isComplete) {
      completedWeeks.add(weekStartDate);
    }
  }

  return completedWeeks;
}

export function calculateCurrentStreak(
  strengthLogs: StrengthLogForStreak[],
  conditioningLogs: ConditioningLogForStreak[],
  userId: string
) {
  const completedWeeks = getCompletedWeekSet(
    strengthLogs,
    conditioningLogs,
    userId
  );

  const currentWeek = getWeekStartDate();

  let cursor = completedWeeks.has(currentWeek)
    ? currentWeek
    : subtractOneWeek(currentWeek);

  let streak = 0;

  while (completedWeeks.has(cursor)) {
    streak += 1;
    cursor = subtractOneWeek(cursor);
  }

  return streak;
}