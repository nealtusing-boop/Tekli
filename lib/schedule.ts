export type StrengthDayKey = "monday" | "tuesday" | "thursday";

export type ConditioningEventKey =
  | "5_mile_run"
  | "murph"
  | "ruck"
  | "amrap_1"
  | "amrap_2";

export type StrengthLift = {
  name: string;
  setCount: number;
};

export const STRENGTH_DAYS: Record<
  StrengthDayKey,
  {
    label: string;
    weekday: string;
    liftKey: "front_squat" | "back_squat" | "deadlift";
    liftLabel: string;
    conditioningEvent?: ConditioningEventKey;
  }
> = {
  monday: {
    label: "Monday Strength",
    weekday: "Monday",
    liftKey: "front_squat",
    liftLabel: "Front Squat",
  },
  tuesday: {
    label: "Tuesday Strength",
    weekday: "Tuesday",
    liftKey: "back_squat",
    liftLabel: "Back Squat",
    conditioningEvent: "amrap_1",
  },
  thursday: {
    label: "Thursday Strength",
    weekday: "Thursday",
    liftKey: "deadlift",
    liftLabel: "Deadlift",
    conditioningEvent: "amrap_2",
  },
};

export const STRENGTH_WORKOUTS: Record<StrengthDayKey, StrengthLift[]> = {
  monday: [
    { name: "Front Squat", setCount: 5 },
    { name: "Bench Press", setCount: 5 },
    { name: "Barbell Row", setCount: 5 },
  ],
  tuesday: [
    { name: "Back Squat", setCount: 5 },
    { name: "Bench Press", setCount: 5 },
    { name: "Barbell Row", setCount: 5 },
  ],
  thursday: [
    { name: "Front Squat", setCount: 5 },
    { name: "Overhead Press", setCount: 5 },
    { name: "Deadlift", setCount: 1 },
  ],
};

export const CONDITIONING_EVENTS: Record<
  ConditioningEventKey,
  {
    label: string;
    type: "time" | "amrap";
  }
> = {
  "5_mile_run": {
    label: "5 Mile Run",
    type: "time",
  },
  murph: {
    label: "Murph",
    type: "time",
  },
  ruck: {
    label: "12 Mile Ruck",
    type: "time",
  },
  amrap_1: {
    label: "AMRAP #1",
    type: "amrap",
  },
  amrap_2: {
    label: "AMRAP #2",
    type: "amrap",
  },
};