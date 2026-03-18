export type StrengthDayKey = "monday" | "tuesday" | "thursday";

export type ConditioningEventKey =
  | "5_mile_run"
  | "murph"
  | "ruck"
  | "amrap_1"
  | "amrap_2";

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