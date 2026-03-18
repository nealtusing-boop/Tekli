export type StrengthDayKey = "monday" | "tuesday" | "thursday";

export type ConditioningEventKey =
  | "5_mile_run"
  | "murph"
  | "ruck"
  | "amrap_1"
  | "amrap_2";

export type LiftKey =
  | "front_squat"
  | "back_squat"
  | "deadlift"
  | "bench_press"
  | "barbell_row"
  | "overhead_press";

export type StrengthLiftDefinition = {
  key: LiftKey;
  name: string;
  setCount: number;
  repTarget: number;
};

export type StrengthDayDefinition = {
  key: StrengthDayKey;
  label: string;
  shortLabel: string;
  weekday: string;
  headline: string;
  primaryLiftKey: LiftKey;
  primaryLiftLabel: string;
  lifts: StrengthLiftDefinition[];
  followUpConditioningEvent?: ConditioningEventKey;
  followUpConditioningHref?: string;
  amrapLink?: string;
};

export type ConditioningEventDefinition = {
  key: ConditioningEventKey;
  label: string;
  shortLabel: string;
  title: string;
  type: "time" | "amrap";
  scoreType: "time" | "amrap";
  actionLabel: string;
  description: string[];
  workoutLines: string[];
};

export type TrainingDayDefinition = {
  key: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  label: string;
  title: string;
  strengthDayKey?: StrengthDayKey;
  conditioningEventKeys: ConditioningEventKey[];
};

export const LIFT_LIBRARY: Record<LiftKey, { key: LiftKey; name: string }> = {
  front_squat: {
    key: "front_squat",
    name: "Front Squat",
  },
  back_squat: {
    key: "back_squat",
    name: "Back Squat",
  },
  deadlift: {
    key: "deadlift",
    name: "Deadlift",
  },
  bench_press: {
    key: "bench_press",
    name: "Bench Press",
  },
  barbell_row: {
    key: "barbell_row",
    name: "Barbell Row",
  },
  overhead_press: {
    key: "overhead_press",
    name: "Overhead Press",
  },
};

export const STRENGTH_DAYS: Record<StrengthDayKey, StrengthDayDefinition> = {
  monday: {
    key: "monday",
    label: "Monday Strength",
    shortLabel: "Monday",
    weekday: "Monday",
    headline: "Monday Strength",
    primaryLiftKey: "front_squat",
    primaryLiftLabel: "Front Squat",
    lifts: [
      {
        key: "front_squat",
        name: "Front Squat",
        setCount: 5,
        repTarget: 5,
      },
      {
        key: "bench_press",
        name: "Bench Press",
        setCount: 5,
        repTarget: 5,
      },
      {
        key: "barbell_row",
        name: "Barbell Row",
        setCount: 5,
        repTarget: 5,
      },
    ],
  },
  tuesday: {
    key: "tuesday",
    label: "Tuesday Strength",
    shortLabel: "Tuesday",
    weekday: "Tuesday",
    headline: "Tuesday Strength",
    primaryLiftKey: "back_squat",
    primaryLiftLabel: "Back Squat",
    lifts: [
      {
        key: "back_squat",
        name: "Back Squat",
        setCount: 5,
        repTarget: 5,
      },
      {
        key: "bench_press",
        name: "Bench Press",
        setCount: 5,
        repTarget: 5,
      },
      {
        key: "barbell_row",
        name: "Barbell Row",
        setCount: 5,
        repTarget: 5,
      },
    ],
    followUpConditioningEvent: "amrap_1",
    followUpConditioningHref: "/conditioning?event=amrap_1",
    amrapLink: "/conditioning?event=amrap_1",
  },
  thursday: {
    key: "thursday",
    label: "Thursday Strength",
    shortLabel: "Thursday",
    weekday: "Thursday",
    headline: "Thursday Strength",
    primaryLiftKey: "deadlift",
    primaryLiftLabel: "Deadlift",
    lifts: [
      {
        key: "front_squat",
        name: "Front Squat",
        setCount: 5,
        repTarget: 5,
      },
      {
        key: "overhead_press",
        name: "Overhead Press",
        setCount: 5,
        repTarget: 5,
      },
      {
        key: "deadlift",
        name: "Deadlift",
        setCount: 1,
        repTarget: 5,
      },
    ],
    followUpConditioningEvent: "amrap_2",
    followUpConditioningHref: "/conditioning?event=amrap_2",
    amrapLink: "/conditioning?event=amrap_2",
  },
};

export const CONDITIONING_EVENTS: Record<
  ConditioningEventKey,
  ConditioningEventDefinition
> = {
  "5_mile_run": {
    key: "5_mile_run",
    label: "5 Mile Run",
    shortLabel: "Run",
    title: "5 Mile Run",
    type: "time",
    scoreType: "time",
    actionLabel: "Log Run",
    description: ["5 mile run (off post)"],
    workoutLines: ["5 mile run (off post)"],
  },
  murph: {
    key: "murph",
    label: "Murph",
    shortLabel: "Murph",
    title: "Modified Murph",
    type: "time",
    scoreType: "time",
    actionLabel: "Log Murph",
    description: [
      "400m Run",
      "5 rounds of:",
      "5 Pull Ups",
      "10 Push Ups",
      "10 Sit Ups",
      "15 Air Squats",
      "Repeat x4 total",
    ],
    workoutLines: [
      "400m Run",
      "5 rounds of:",
      "5 Pull Ups",
      "10 Push Ups",
      "10 Sit Ups",
      "15 Air Squats",
      "Repeat x4 total",
    ],
  },
  ruck: {
    key: "ruck",
    label: "40 lb Ruck",
    shortLabel: "Ruck",
    title: "40 lb Ruck",
    type: "time",
    scoreType: "time",
    actionLabel: "Log Ruck",
    description: ["40 lb ruck (post lap x2)"],
    workoutLines: ["40 lb ruck (post lap x2)"],
  },
  amrap_1: {
    key: "amrap_1",
    label: "AMRAP #1",
    shortLabel: "AMRAP #1",
    title: "AMRAP #1",
    type: "amrap",
    scoreType: "amrap",
    actionLabel: "Log AMRAP #1",
    description: [
      "15 Minute AMRAP",
      "20 KB Swings @ 53/35",
      "15 Thrusters @ 40/20",
      "10 Toes to Bar",
    ],
    workoutLines: [
      "15 Minute AMRAP",
      "20 KB Swings @ 53/35",
      "15 Thrusters @ 40/20",
      "10 Toes to Bar",
    ],
  },
  amrap_2: {
    key: "amrap_2",
    label: "AMRAP #2",
    shortLabel: "AMRAP #2",
    title: "AMRAP #2",
    type: "amrap",
    scoreType: "amrap",
    actionLabel: "Log AMRAP #2",
    description: [
      "15 Minute AMRAP",
      "20 Alt DB Snatches @ 40/20",
      "15 Russian Twists @ 45/25",
      "10 Burpee Box Jump Overs",
    ],
    workoutLines: [
      "15 Minute AMRAP",
      "20 Alt DB Snatches @ 40/20",
      "15 Russian Twists @ 45/25",
      "10 Burpee Box Jump Overs",
    ],
  },
};

export const TRAINING_WEEK: TrainingDayDefinition[] = [
  {
    key: "monday",
    label: "Monday",
    title: CONDITIONING_EVENTS["5_mile_run"].title,
    conditioningEventKeys: ["5_mile_run"],
  },
  {
    key: "tuesday",
    label: "Tuesday",
    title: "Strength + AMRAP #1",
    strengthDayKey: "tuesday",
    conditioningEventKeys: ["amrap_1"],
  },
  {
    key: "wednesday",
    label: "Wednesday",
    title: CONDITIONING_EVENTS.murph.title,
    conditioningEventKeys: ["murph"],
  },
  {
    key: "thursday",
    label: "Thursday",
    title: "Strength + AMRAP #2",
    strengthDayKey: "thursday",
    conditioningEventKeys: ["amrap_2"],
  },
  {
    key: "friday",
    label: "Friday",
    title: CONDITIONING_EVENTS.ruck.title,
    conditioningEventKeys: ["ruck"],
  },
];

export function getStrengthWorkout(day: StrengthDayKey) {
  return STRENGTH_DAYS[day];
}

export function getConditioningEvent(event: ConditioningEventKey) {
  return CONDITIONING_EVENTS[event];
}

export function getTrainingDay(
  key: TrainingDayDefinition["key"]
): TrainingDayDefinition | undefined {
  return TRAINING_WEEK.find((day) => day.key === key);
}

export function buildStrengthDescription(day: StrengthDayKey) {
  return STRENGTH_DAYS[day].lifts.map(
    (lift) => `${lift.name} ${lift.setCount}x${lift.repTarget}`
  );
}

export function buildTrainingDayDescription(day: TrainingDayDefinition) {
  const lines: string[] = [];

  if (day.strengthDayKey) {
    lines.push("Strength");
    lines.push(...buildStrengthDescription(day.strengthDayKey));
  }

  day.conditioningEventKeys.forEach((eventKey, index) => {
    const event = CONDITIONING_EVENTS[eventKey];

    if (lines.length > 0 && index === 0) {
      lines.push("");
    }

    if (lines.length > 0 && index > 0) {
      lines.push("");
    }

    lines.push(...event.workoutLines);
  });

  return lines;
}

export function buildTrainingDayActions(day: TrainingDayDefinition) {
  const actions: { label: string; href: string }[] = [];

  if (day.strengthDayKey) {
    actions.push({
      label: "Log Strength",
      href: `/strength?day=${day.strengthDayKey}`,
    });
  }

  day.conditioningEventKeys.forEach((eventKey) => {
    const event = CONDITIONING_EVENTS[eventKey];

    actions.push({
      label: event.actionLabel,
      href: `/conditioning?event=${eventKey}`,
    });
  });

  return actions;
}