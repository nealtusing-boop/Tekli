export type StrengthDayKey = "tuesday" | "thursday";

export type ConditioningEventKey =
  | "5_mile_run"
  | "murph"
  | "ruck"
  | "amrap_1"
  | "amrap_2";

export type LiftConfig = {
  name: string;
  setCount: number;
};

export const STRENGTH_WORKOUTS: Record<StrengthDayKey, LiftConfig[]> = {
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
    description: string;
  }
> = {
  "5_mile_run": {
    label: "5 Mile Run",
    type: "time",
    description: "Log your total finishing time.",
  },
  murph: {
    label: "Modified Murph",
    type: "time",
    description: "Log your total finishing time.",
  },
  ruck: {
    label: "40 lb Ruck",
    type: "time",
    description: "Log your total finishing time.",
  },
  amrap_1: {
    label: "AMRAP #1",
    type: "amrap",
    description:
      "15 minutes: 20 KB swings, 10 DB thrusters, 10 toes to bar.",
  },
  amrap_2: {
    label: "AMRAP #2",
    type: "amrap",
    description:
      "15 minutes: 20 alternating DB snatches, 10 burpee box jump overs, 10 Russian twists.",
  },
};

export function getTodayPlan(dayIndex: number) {
  switch (dayIndex) {
    case 1:
      return {
        title: "Monday",
        subtitle: "5 Mile Run",
        actions: [{ label: "Log Run", href: "/conditioning?event=5_mile_run" }],
      };
    case 2:
      return {
        title: "Tuesday",
        subtitle: "Strength + AMRAP #1",
        actions: [
          { label: "Log Strength", href: "/strength?day=tuesday" },
          { label: "Log AMRAP #1", href: "/conditioning?event=amrap_1" },
        ],
      };
    case 3:
      return {
        title: "Wednesday",
        subtitle: "Modified Murph",
        actions: [{ label: "Log Murph", href: "/conditioning?event=murph" }],
      };
    case 4:
      return {
        title: "Thursday",
        subtitle: "Strength + AMRAP #2",
        actions: [
          { label: "Log Strength", href: "/strength?day=thursday" },
          { label: "Log AMRAP #2", href: "/conditioning?event=amrap_2" },
        ],
      };
    case 5:
      return {
        title: "Friday",
        subtitle: "40 lb Ruck",
        actions: [{ label: "Log Ruck", href: "/conditioning?event=ruck" }],
      };
    default:
      return {
        title: "Weekend",
        subtitle: "No scheduled workout",
        actions: [],
      };
  }
}