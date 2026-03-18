"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { getWeekStartDate } from "../../lib/date";
import { STRENGTH_WORKOUTS, StrengthDayKey } from "../../lib/schedule";

type LiftState = {
  name: string;
  setCount: number;
  workingWeight: number;
  sets: number[];
};

export default function StrengthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profileName, setProfileName] = useState("");
  const [userId, setUserId] = useState("");
  const [lifts, setLifts] = useState<LiftState[]>([]);

  const dayParam = searchParams.get("day");
  const strengthDay: StrengthDayKey =
    dayParam === "thursday" ? "thursday" : "tuesday";

  const title =
    strengthDay === "tuesday" ? "Tuesday Strength" : "Thursday Strength";

  const nextAmrapHref =
    strengthDay === "tuesday"
      ? "/conditioning?event=amrap_1"
      : "/conditioning?event=amrap_2";

  const nextAmrapLabel =
    strengthDay === "tuesday" ? "Go to AMRAP #1" : "Go to AMRAP #2";

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

      const currentProfileName = profile?.profile_name || "";
      setProfileName(currentProfileName);

      const { data: existingLog } = await supabase
        .from("strength_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate)
        .eq("workout_day", strengthDay)
        .maybeSingle();

      if (existingLog) {
        setMessage("You already submitted this strength workout for this week.");
      }

      const dayLifts = STRENGTH_WORKOUTS[strengthDay];

      const { data: settings } = await supabase
        .from("lift_settings")
        .select("lift_name, current_weight")
        .eq("user_id", user.id);

      const settingsMap = new Map<string, number>();

      (settings || []).forEach((row: any) => {
        settingsMap.set(row.lift_name, row.current_weight || 0);
      });

      const initialLifts: LiftState[] = dayLifts.map((lift) => ({
        name: lift.name,
        setCount: lift.setCount,
        workingWeight: settingsMap.get(lift.name) || 0,
        sets: [0, 0, 0, 0, 0],
      }));

      setLifts(initialLifts);
      setLoading(false);
    }

    loadPage();
  }, [router, strengthDay, weekStartDate]);

  function updateSet(liftIndex: number, setIndex: number, delta: number) {
    setLifts((current) =>
      current.map((lift, currentLiftIndex) => {
        if (currentLiftIndex !== liftIndex) return lift;
        if (setIndex >= lift.setCount) return lift;

        const nextSets = [...lift.sets];
        nextSets[setIndex] = Math.max(0, Math.min(5, nextSets[setIndex] + delta));

        return { ...lift, sets: nextSets };
      })
    );
  }

  async function handleSave() {
    if (!userId || !profileName) {
      setMessage("Could not load your profile.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const liftPayloads = lifts.map((lift) => {
        const relevantSets = lift.sets.slice(0, lift.setCount);
        const completed = relevantSets.every((rep) => rep === 5);
        const nextWeight = completed ? lift.workingWeight + 10 : lift.workingWeight;

        return {
          name: lift.name,
          set_count: lift.setCount,
          working_weight: lift.workingWeight,
          sets: lift.sets,
          completed,
          next_weight: nextWeight,
        };
      });

      const { error: insertError } = await supabase.from("strength_logs").insert({
        user_id: userId,
        profile_name: profileName,
        workout_day: strengthDay,
        week_start_date: weekStartDate,
        lift_1: liftPayloads[0],
        lift_2: liftPayloads[1],
        lift_3: liftPayloads[2],
      });

      if (insertError) {
        throw insertError;
      }

      const liftSettingsRows = liftPayloads.map((lift) => ({
        user_id: userId,
        lift_name: lift.name,
        current_weight: lift.next_weight,
      }));

      const { error: settingsError } = await supabase
        .from("lift_settings")
        .upsert(liftSettingsRows, {
          onConflict: "user_id,lift_name",
        });

      if (settingsError) {
        throw settingsError;
      }

      setMessage("Strength workout saved. Continue straight to your AMRAP.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to save strength workout.");
    } finally {
      setSaving(false);
    }
  }

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
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Log each set from 0 to 5 reps. Tuesday and Thursday only count as
                complete training days once the matching AMRAP is also logged.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={nextAmrapHref} className="squad-button squad-button-secondary">
                {nextAmrapLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {lifts.map((lift, liftIndex) => (
            <div key={lift.name} className="squad-card p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="squad-label">Lift</p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {lift.name}
                  </h2>
                  <p className="mt-3 text-slate-300">
                    Current Working Weight:{" "}
                    <span className="font-bold text-white">
                      {lift.workingWeight} lb
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {lift.setCount === 1 ? "This lift is 1x5." : "This lift is 5x5."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Sets
                  </p>
                  <p className="mt-2 text-2xl font-bold">{lift.setCount}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: lift.setCount }).map((_, setIndex) => {
                  const disabled =
                    saving || message.includes("already submitted");

                  const isComplete = lift.sets[setIndex] === 5;

                  return (
                    <div
                      key={setIndex}
                      className={`rounded-3xl border p-4 transition ${
                        isComplete
                          ? "border-blue-400/30 bg-blue-500/10"
                          : "border-white/8 bg-white/4"
                      }`}
                    >
                      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                        Set {setIndex + 1}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => updateSet(liftIndex, setIndex, -1)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-xl font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
                        >
                          −
                        </button>

                        <span className="min-w-[44px] text-center text-3xl font-bold">
                          {lift.sets[setIndex]}
                        </span>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => updateSet(liftIndex, setIndex, 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-xl font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="squad-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              onClick={handleSave}
              disabled={saving || message.includes("already submitted")}
              className="squad-button squad-button-primary"
            >
              {saving ? "Saving..." : "Save Strength Workout"}
            </button>

            <Link href={nextAmrapHref} className="squad-button squad-button-secondary">
              {nextAmrapLabel}
            </Link>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}