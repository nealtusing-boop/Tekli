"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import {
  STRENGTH_DAYS,
  STRENGTH_WORKOUTS,
  StrengthDayKey,
} from "../../lib/schedule";
import { getWeekStartDate } from "../../lib/date";

type LiftState = {
  name: string;
  working_weight: number;
  set_count: number;
  sets: number[];
  completed: boolean;
  next_weight: number;
};

type LiftSettingRow = {
  lift_name: string;
  current_weight: number | null;
};

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  maxReps,
  disabled = false,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  maxReps: number;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-100">{label}</label>
        <span className="text-xs text-slate-400">0–{maxReps} reps</span>
      </div>

      <div className="squad-stepper">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled}
          className="squad-stepper-button"
        >
          −
        </button>

        <div className="squad-stepper-value">
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
            {value}
          </p>
        </div>

        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled}
          className="squad-stepper-button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function createLiftState(
  name: string,
  setCount: number,
  workingWeight: number
): LiftState {
  return {
    name,
    working_weight: workingWeight,
    set_count: setCount,
    sets: Array(setCount).fill(0),
    completed: false,
    next_weight: workingWeight,
  };
}

function calculateNextWeight(
  liftName: string,
  completed: boolean,
  current: number
) {
  if (!current || current <= 0) return 0;

  const upper = liftName.toUpperCase();

  if (upper.includes("SQUAT") || upper.includes("DEADLIFT")) {
    return completed ? current + 10 : Math.max(0, current - 10);
  }

  return completed ? current + 5 : Math.max(0, current - 5);
}

export default function StrengthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [lift1, setLift1] = useState<LiftState | null>(null);
  const [lift2, setLift2] = useState<LiftState | null>(null);
  const [lift3, setLift3] = useState<LiftState | null>(null);

  const dayParam = searchParams.get("day") as StrengthDayKey | null;
  const dayKey: StrengthDayKey =
    dayParam && STRENGTH_DAYS[dayParam] ? dayParam : "tuesday";

  const dayConfig = STRENGTH_DAYS[dayKey];
  const workoutDefinition = STRENGTH_WORKOUTS[dayKey];
  const weekStartDate = useMemo(() => getWeekStartDate(), []);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_name")
        .eq("id", user.id)
        .single();

      setProfileName(profile?.profile_name || "");

      const { data: settings } = await supabase
        .from("lift_settings")
        .select("lift_name, current_weight")
        .eq("user_id", user.id);

      const settingsMap = new Map<string, number>();

      (settings || []).forEach((row: LiftSettingRow) => {
        settingsMap.set(row.lift_name, row.current_weight || 0);
      });

      const first = workoutDefinition[0];
      const second = workoutDefinition[1];
      const third = workoutDefinition[2];

      setLift1(
        first
          ? createLiftState(
              first.name,
              first.setCount,
              settingsMap.get(first.name) || 0
            )
          : null
      );

      setLift2(
        second
          ? createLiftState(
              second.name,
              second.setCount,
              settingsMap.get(second.name) || 0
            )
          : null
      );

      setLift3(
        third
          ? createLiftState(
              third.name,
              third.setCount,
              settingsMap.get(third.name) || 0
            )
          : null
      );

      const { data: existingLog } = await supabase
        .from("strength_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate)
        .eq("workout_day", dayKey)
        .maybeSingle();

      if (existingLog) {
        setMessage("You already submitted this workout for this week.");
      }

      setLoading(false);
    }

    loadPage();
  }, [dayKey, router, weekStartDate, workoutDefinition]);

  const alreadySubmitted = message.includes("already submitted");

  function updateSet(
    lift: LiftState | null,
    setLift: (value: LiftState | null) => void,
    index: number,
    value: number
  ) {
    if (!lift) return;

    const maxReps = 5;
    const nextSets = [...lift.sets];
    nextSets[index] = Math.max(0, Math.min(maxReps, value));

    const completed = nextSets.every((rep) => rep >= maxReps);
    const nextWeight = calculateNextWeight(
      lift.name,
      completed,
      lift.working_weight
    );

    setLift({
      ...lift,
      sets: nextSets,
      completed,
      next_weight: nextWeight,
    });
  }

  async function handleSave() {
    if (!userId || !profileName || !lift1) {
      setMessage("Could not load your profile.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const strengthPayload = {
        user_id: userId,
        profile_name: profileName,
        week_start_date: weekStartDate,
        workout_day: dayKey,
        lift_1: lift1,
        lift_2: lift2,
        lift_3: lift3,
      };

      const { error: logError } = await supabase
        .from("strength_logs")
        .insert(strengthPayload);

      if (logError) throw logError;

      const upserts = [lift1, lift2, lift3]
        .filter((lift): lift is LiftState => Boolean(lift))
        .map((lift) => ({
          user_id: userId,
          lift_name: lift.name,
          current_weight: lift.next_weight,
        }));

      const { error: settingsError } = await supabase
        .from("lift_settings")
        .upsert(upserts, {
          onConflict: "user_id,lift_name",
        });

      if (settingsError) throw settingsError;

      setMessage("Strength workout saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save strength workout."
      );
    } finally {
      setSaving(false);
    }
  }

  const lifts = [lift1, lift2, lift3].filter(
    (lift): lift is LiftState => Boolean(lift)
  );

  const amrapLink = dayConfig.amrapLink ?? null;

  if (loading) {
    return (
      <main className="squad-shell py-6">
        <div className="squad-card p-6">Loading...</div>
      </main>
    );
  }

  return (
    <main className="squad-shell py-4 sm:py-6">
      <div className="squad-page-stack">
        <AppNav />

        <section className="squad-card overflow-hidden p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="squad-label">Strength Session</p>
              <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                {dayConfig.label}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Log each set for every lift. If all reps are hit, the lift counts
                as passed and the next weight increases automatically.
              </p>
            </div>

            {amrapLink && (
              <button
                type="button"
                onClick={() => router.push(amrapLink)}
                className="rounded-3xl border border-blue-400/30 bg-blue-500/12 px-5 py-4 text-left transition hover:bg-blue-500/18"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Next Up
                </p>
                <p className="mt-2 text-xl font-bold text-white">Go to AMRAP</p>
              </button>
            )}
          </div>
        </section>

        <section className="squad-card p-5 sm:p-6">
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="squad-stat-pill">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Athlete
              </p>
              <p className="mt-2 truncate text-base font-semibold text-white">
                {profileName || "Loading"}
              </p>
            </div>

            <div className="squad-stat-pill">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Day
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {dayConfig.label}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {lifts.map((lift, liftIndex) => (
              <div
                key={`${lift.name}-${liftIndex}`}
                className="rounded-3xl border border-white/8 bg-white/4 p-4 sm:p-5"
              >
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Lift {liftIndex + 1}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                      {lift.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {lift.set_count} set{lift.set_count === 1 ? "" : "s"} of 5 reps
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Working Weight
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {lift.working_weight} lb
                    </p>
                  </div>
                </div>

                <div
                  className={`grid gap-4 ${
                    lift.set_count === 1
                      ? "md:grid-cols-1"
                      : lift.set_count === 5
                      ? "md:grid-cols-2 xl:grid-cols-5"
                      : "md:grid-cols-2"
                  }`}
                >
                  {lift.sets.map((setValue, setIndex) => (
                    <Stepper
                      key={`${lift.name}-set-${setIndex}`}
                      label={`Set ${setIndex + 1}`}
                      value={setValue}
                      onDecrease={() => {
                        if (liftIndex === 0) {
                          updateSet(lift1, setLift1, setIndex, setValue - 1);
                        } else if (liftIndex === 1) {
                          updateSet(lift2, setLift2, setIndex, setValue - 1);
                        } else {
                          updateSet(lift3, setLift3, setIndex, setValue - 1);
                        }
                      }}
                      onIncrease={() => {
                        if (liftIndex === 0) {
                          updateSet(lift1, setLift1, setIndex, setValue + 1);
                        } else if (liftIndex === 1) {
                          updateSet(lift2, setLift2, setIndex, setValue + 1);
                        } else {
                          updateSet(lift3, setLift3, setIndex, setValue + 1);
                        }
                      }}
                      maxReps={5}
                      disabled={saving || alreadySubmitted}
                    />
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/18 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {lift.completed ? "Passed" : "Not passed yet"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/18 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Next Weight
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {lift.next_weight} lb
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleSave}
              disabled={saving || alreadySubmitted}
              className="squad-button squad-button-primary"
            >
              {saving ? "Saving..." : "Save Workout"}
            </button>

            {message && (
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {message}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}