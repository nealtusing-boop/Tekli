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

type StoredLiftLog = {
  name?: string;
  working_weight?: number;
  set_count?: number;
  sets?: number[];
  completed?: boolean;
  next_weight?: number;
} | null;

type StrengthLogRow = {
  id: string;
  workout_day: string;
  week_start_date: string;
  created_at?: string | null;
  lift_1: StoredLiftLog;
  lift_2: StoredLiftLog;
  lift_3: StoredLiftLog;
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

function calculateNextWeight(completed: boolean, current: number) {
  if (!current || current <= 0) return 0;
  return completed ? current + 10 : current;
}

function createLiftState(
  name: string,
  setCount: number,
  workingWeight: number
): LiftState {
  const sets = Array(setCount).fill(0);
  const completed = false;

  return {
    name,
    working_weight: workingWeight,
    set_count: setCount,
    sets,
    completed,
    next_weight: calculateNextWeight(completed, workingWeight),
  };
}

function createLiftStateFromStoredLog(
  fallbackName: string,
  fallbackSetCount: number,
  fallbackWeight: number,
  storedLift: StoredLiftLog
): LiftState {
  const name = storedLift?.name || fallbackName;
  const setCount = storedLift?.set_count || fallbackSetCount;
  const workingWeight =
    typeof storedLift?.working_weight === "number"
      ? storedLift.working_weight
      : fallbackWeight;

  const rawSets = Array.isArray(storedLift?.sets) ? storedLift.sets : [];
  const sets = Array.from({ length: setCount }, (_, index) => {
    const value = rawSets[index];
    if (typeof value !== "number") return 0;
    return Math.max(0, Math.min(5, value));
  });

  const completed = sets.every((rep) => rep >= 5);

  return {
    name,
    working_weight: workingWeight,
    set_count: setCount,
    sets,
    completed,
    next_weight: calculateNextWeight(completed, workingWeight),
  };
}

function sortLogsNewestFirst(rows: StrengthLogRow[]) {
  return [...rows].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (bTime !== aTime) return bTime - aTime;

    return b.id.localeCompare(a.id);
  });
}

export default function StrengthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [existingLogId, setExistingLogId] = useState<string | null>(null);
  const [baseWeights, setBaseWeights] = useState<Record<string, number>>({});
  const [lift1, setLift1] = useState<LiftState | null>(null);
  const [lift2, setLift2] = useState<LiftState | null>(null);
  const [lift3, setLift3] = useState<LiftState | null>(null);

  const dayParam = searchParams.get("day") as StrengthDayKey | null;
  const dayKey: StrengthDayKey =
    dayParam && STRENGTH_DAYS[dayParam] ? dayParam : "tuesday";

  const dayConfig = STRENGTH_DAYS[dayKey];
  const workoutDefinition = STRENGTH_WORKOUTS[dayKey];
  const weekStartDate = useMemo(() => getWeekStartDate(), []);

  function hydrateFromLog(
    log: StrengthLogRow | null,
    settingsMap: Record<string, number>
  ) {
    const first = workoutDefinition[0];
    const second = workoutDefinition[1];
    const third = workoutDefinition[2];

    if (log) {
      setExistingLogId(log.id);

      setLift1(
        first
          ? createLiftStateFromStoredLog(
              first.name,
              first.setCount,
              settingsMap[first.name] || 0,
              log.lift_1
            )
          : null
      );

      setLift2(
        second
          ? createLiftStateFromStoredLog(
              second.name,
              second.setCount,
              settingsMap[second.name] || 0,
              log.lift_2
            )
          : null
      );

      setLift3(
        third
          ? createLiftStateFromStoredLog(
              third.name,
              third.setCount,
              settingsMap[third.name] || 0,
              log.lift_3
            )
          : null
      );
    } else {
      setExistingLogId(null);

      setLift1(
        first
          ? createLiftState(first.name, first.setCount, settingsMap[first.name] || 0)
          : null
      );

      setLift2(
        second
          ? createLiftState(
              second.name,
              second.setCount,
              settingsMap[second.name] || 0
            )
          : null
      );

      setLift3(
        third
          ? createLiftState(
              third.name,
              third.setCount,
              settingsMap[third.name] || 0
            )
          : null
      );
    }
  }

  async function removeDuplicateLogs(rows: StrengthLogRow[]) {
    if (rows.length <= 1) return rows[0] ?? null;

    const sorted = sortLogsNewestFirst(rows);
    const keep = sorted[0];
    const duplicateIds = sorted.slice(1).map((row) => row.id);

    if (duplicateIds.length > 0) {
      const { error } = await supabase
        .from("strength_logs")
        .delete()
        .in("id", duplicateIds);

      if (error) {
        throw error;
      }
    }

    return keep;
  }

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

    const [{ data: profile }, { data: settings }, { data: logRows, error: logError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("profile_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("lift_settings")
          .select("lift_name, current_weight")
          .eq("user_id", user.id),
        supabase
          .from("strength_logs")
          .select(
            "id, workout_day, week_start_date, created_at, lift_1, lift_2, lift_3"
          )
          .eq("user_id", user.id)
          .eq("week_start_date", weekStartDate)
          .eq("workout_day", dayKey),
      ]);

    if (logError) {
      setMessage(logError.message);
    }

    setProfileName(profile?.profile_name || "");

    const settingsMap: Record<string, number> = {};
    (settings || []).forEach((row: LiftSettingRow) => {
      settingsMap[row.lift_name] = row.current_weight || 0;
    });

    setBaseWeights(settingsMap);

    const rows = (logRows || []) as StrengthLogRow[];
    const canonicalLog = await removeDuplicateLogs(rows);

    hydrateFromLog(canonicalLog, settingsMap);

    if (canonicalLog) {
      setMessage("Existing log loaded. You can update or delete it.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, [dayKey, weekStartDate, router]);

  function updateSet(
    lift: LiftState | null,
    setLift: (value: LiftState | null) => void,
    index: number,
    value: number
  ) {
    if (!lift) return;

    const nextSets = [...lift.sets];
    nextSets[index] = Math.max(0, Math.min(5, value));

    const completed = nextSets.every((rep) => rep >= 5);
    const nextWeight = calculateNextWeight(completed, lift.working_weight);

    setLift({
      ...lift,
      sets: nextSets,
      completed,
      next_weight: nextWeight,
    });
  }

  function resetLiftsToDefaultWeights() {
    const first = workoutDefinition[0];
    const second = workoutDefinition[1];
    const third = workoutDefinition[2];

    setLift1(
      first
        ? createLiftState(first.name, first.setCount, baseWeights[first.name] || 0)
        : null
    );
    setLift2(
      second
        ? createLiftState(
            second.name,
            second.setCount,
            baseWeights[second.name] || 0
          )
        : null
    );
    setLift3(
      third
        ? createLiftState(third.name, third.setCount, baseWeights[third.name] || 0)
        : null
    );
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

      if (existingLogId) {
        const { error: updateError } = await supabase
          .from("strength_logs")
          .update(strengthPayload)
          .eq("id", existingLogId);

        if (updateError) throw updateError;
      } else {
        const { data: insertedRows, error: insertError } = await supabase
          .from("strength_logs")
          .insert(strengthPayload)
          .select("id");

        if (insertError) throw insertError;

        setExistingLogId(insertedRows?.[0]?.id || null);
      }

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

      const nextSettingsMap = { ...baseWeights };
      upserts.forEach((row) => {
        nextSettingsMap[row.lift_name] = row.current_weight;
      });
      setBaseWeights(nextSettingsMap);

      const { data: refreshedRows, error: refreshError } = await supabase
        .from("strength_logs")
        .select(
          "id, workout_day, week_start_date, created_at, lift_1, lift_2, lift_3"
        )
        .eq("user_id", userId)
        .eq("week_start_date", weekStartDate)
        .eq("workout_day", dayKey);

      if (refreshError) throw refreshError;

      const canonicalLog = await removeDuplicateLogs(
        (refreshedRows || []) as StrengthLogRow[]
      );

      hydrateFromLog(canonicalLog, nextSettingsMap);

      setMessage(existingLogId ? "Strength workout updated." : "Strength workout saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save strength workout."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingLogId) return;

    const confirmed = window.confirm(
      `Delete this saved strength log?\n\n${dayConfig.label}`
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("strength_logs")
        .delete()
        .eq("id", existingLogId);

      if (error) throw error;

      setExistingLogId(null);
      resetLiftsToDefaultWeights();
      setMessage("Strength workout deleted.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete strength workout."
      );
    } finally {
      setDeleting(false);
    }
  }

  const lifts = [lift1, lift2, lift3].filter(
    (lift): lift is LiftState => Boolean(lift)
  );

  const amrapLink = dayConfig.amrapLink ?? null;
  const controlsDisabled = saving || deleting;

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
                Log each set for every lift. Complete all prescribed reps and the
                next weight goes up by 10. Miss reps and the weight stays the same.
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
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
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

            <div className="squad-stat-pill">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Log Status
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {existingLogId ? "Saved log found" : "No saved log yet"}
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
                      disabled={controlsDisabled}
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

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={controlsDisabled}
                className="squad-button squad-button-primary"
              >
                {saving
                  ? existingLogId
                    ? "Updating..."
                    : "Saving..."
                  : existingLogId
                    ? "Update Workout"
                    : "Save Workout"}
              </button>

              {existingLogId && (
                <button
                  onClick={handleDelete}
                  disabled={controlsDisabled}
                  className="squad-button squad-button-secondary"
                >
                  {deleting ? "Deleting..." : "Delete Saved Log"}
                </button>
              )}
            </div>

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