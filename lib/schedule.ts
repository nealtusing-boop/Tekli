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

export type StrengthDayDefinition = {
  label: string;
  weekday: string;
  liftKey: "front_squat" | "back_squat" | "deadlift";
  liftLabel: string;
  lifts: string[];
  conditioningEvent?: ConditioningEventKey;
  amrapLink?: string;
};

export type ConditioningEventDefinition = {
  label: string;
  title: string;
  type: "time" | "amrap";
  description: string[];
  actionLabel: string;
};

export type DayPlan = {
  key: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  label: string;
  title: string;
  description: string[];
  actions: { label: string; href: string }[];
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

export const STRENGTH_DAYS: Record<StrengthDayKey, StrengthDayDefinition> = {
  monday: {
    label: "Monday Strength",
    weekday: "Monday",
    liftKey: "front_squat",
    liftLabel: "Front Squat",
    lifts: STRENGTH_WORKOUTS.monday.map((lift) => lift.name),
  },
  tuesday: {
    label: "Tuesday Strength",
    weekday: "Tuesday",
    liftKey: "back_squat",
    liftLabel: "Back Squat",
    lifts: STRENGTH_WORKOUTS.tuesday.map((lift) => lift.name),
    conditioningEvent: "amrap_1",
    amrapLink: "/conditioning?event=amrap_1",
  },
  thursday: {
    label: "Thursday Strength",
    weekday: "Thursday",
    liftKey: "deadlift",
    liftLabel: "Deadlift",
    lifts: STRENGTH_WORKOUTS.thursday.map((lift) => lift.name),
    conditioningEvent: "amrap_2",
    amrapLink: "/conditioning?event=amrap_2",
  },
};

export const CONDITIONING_EVENTS: Record<
  ConditioningEventKey,
  ConditioningEventDefinition
> = {
  "5_mile_run": {
    label: "5 Mile Run",
    title: "5 Mile Run",
    type: "time",
    description: ["5 mile run (off post)"],
    actionLabel: "Log Run",
  },
  murph: {
    label: "Murph",
    title: "Modified Murph",
    type: "time",
    description: [
      "400m Run",
      "5 rounds of:",
      "5 Pull Ups",
      "10 Push Ups",
      "10 Sit Ups",
      "15 Air Squats",
      "Repeat x4 total",
    ],
    actionLabel: "Log Murph",
  },
  ruck: {
    label: "40 lb Ruck",
    title: "40 lb Ruck",
    type: "time",
    description: ["40 lb ruck (post lap x2)"],
    actionLabel: "Log Ruck",
  },
  amrap_1: {
    label: "AMRAP #1",
    title: "AMRAP #1",
    type: "amrap",
    description: [
      "15 Minute AMRAP",
      "20 KB Swings @ 53/35",
      "15 Thrusters @ 40/20",
      "10 Toes to Bar",
    ],
    actionLabel: "Log AMRAP #1",
  },
  amrap_2: {
    label: "AMRAP #2",
    title: "AMRAP #2",
    type: "amrap",
    description: [
      "15 Minute AMRAP",
      "20 Alt DB Snatches @ 40/20",
      "15 Russian Twists @ 45/25",
      "10 Burpee Box Jump Overs",
    ],
    actionLabel: "Log AMRAP #2",
  },
};

function buildStrengthDescription(day: StrengthDayKey) {
  const workout = STRENGTH_WORKOUTS[day];

  return workout.map((lift) => `${lift.name} ${lift.setCount}x5`);
}

export const WEEK_PLANS: DayPlan[] = [
  {
    key: "monday",
    label: "Monday",
    title: CONDITIONING_EVENTS["5_mile_run"].title,
    description: CONDITIONING_EVENTS["5_mile_run"].description,
    actions: [
      {
        label: CONDITIONING_EVENTS["5_mile_run"].actionLabel,
        href: "/conditioning?event=5_mile_run",
      },
    ],
  },
  {
    key: "tuesday",
    label: "Tuesday",
    title: "Strength + AMRAP #1",
    description: [
      "Strength",
      ...buildStrengthDescription("tuesday"),
      "",
      ...CONDITIONING_EVENTS.amrap_1.description,
    ],
    actions: [
      { label: "Log Strength", href: "/strength?day=tuesday" },
      {
        label: CONDITIONING_EVENTS.amrap_1.actionLabel,
        href: "/conditioning?event=amrap_1",
      },
    ],
  },
  {
    key: "wednesday",
    label: "Wednesday",
    title: CONDITIONING_EVENTS.murph.title,
    description: CONDITIONING_EVENTS.murph.description,
    actions: [
      {
        label: CONDITIONING_EVENTS.murph.actionLabel,
        href: "/conditioning?event=murph",
      },
    ],
  },
  {
    key: "thursday",
    label: "Thursday",
    title: "Strength + AMRAP #2",
    description: [
      "Strength",
      ...buildStrengthDescription("thursday"),
      "",
      ...CONDITIONING_EVENTS.amrap_2.description,
    ],
    actions: [
      { label: "Log Strength", href: "/strength?day=thursday" },
      {
        label: CONDITIONING_EVENTS.amrap_2.actionLabel,
        href: "/conditioning?event=amrap_2",
      },
    ],
  },
  {
    key: "friday",
    label: "Friday",
    title: CONDITIONING_EVENTS.ruck.title,
    description: CONDITIONING_EVENTS.ruck.description,
    actions: [
      {
        label: CONDITIONING_EVENTS.ruck.actionLabel,
        href: "/conditioning?event=ruck",
      },
    ],
  },
];

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