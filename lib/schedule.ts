import {
  CONDITIONING_EVENTS,
  STRENGTH_DAYS,
  TRAINING_WEEK,
  buildStrengthDescription,
  buildTrainingDayActions,
  buildTrainingDayDescription,
  type ConditioningEventDefinition,
  type ConditioningEventKey,
  type StrengthDayDefinition,
  type StrengthDayKey,
  type StrengthLiftDefinition,
} from "./workouts";

export type { StrengthDayKey, ConditioningEventKey };

export type StrengthLift = {
  name: string;
  setCount: number;
};

export type DayPlan = {
  key: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  label: string;
  title: string;
  description: string[];
  actions: { label: string; href: string }[];
};

export const STRENGTH_WORKOUTS: Record<StrengthDayKey, StrengthLift[]> = {
  monday: STRENGTH_DAYS.monday.lifts.map(mapLift),
  tuesday: STRENGTH_DAYS.tuesday.lifts.map(mapLift),
  thursday: STRENGTH_DAYS.thursday.lifts.map(mapLift),
};

function mapLift(lift: StrengthLiftDefinition): StrengthLift {
  return {
    name: lift.name,
    setCount: lift.setCount,
  };
}

export const STRENGTH_DAYS_LEGACY: Record<StrengthDayKey, StrengthDayDefinition> =
  STRENGTH_DAYS;

export const CONDITIONING_EVENTS_LEGACY: Record<
  ConditioningEventKey,
  ConditioningEventDefinition
> = CONDITIONING_EVENTS;

export const WEEK_PLANS: DayPlan[] = TRAINING_WEEK.map((day) => ({
  key: day.key,
  label: day.label,
  title: day.title,
  description: buildTrainingDayDescription(day),
  actions: buildTrainingDayActions(day),
}));

export { STRENGTH_DAYS, CONDITIONING_EVENTS };

export function getDefaultDayIndex() {
  const jsDay = new Date().getDay();

  if (jsDay === 1) return 0;
  if (jsDay === 2) return 1;
  if (jsDay === 3) return 2;
  if (jsDay === 4) return 3;
  if (jsDay === 5) return 4;

  return 0;
}

export function getDisplayedDateForIndex(index: number) {
  const today = new Date();
  const jsDay = today.getDay();

  const monday = new Date(today);
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  monday.setDate(today.getDate() + diffToMonday);

  const result = new Date(monday);
  result.setDate(monday.getDate() + index);

  return result.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export { buildStrengthDescription };