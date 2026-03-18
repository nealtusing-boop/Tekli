"use client";

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

      setMessage("Strength workout saved.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to save strength workout.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-6xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-slate-300">
            Complete your sets. Reps are limited from 0 to 5.
          </p>
        </div>

        <div className="grid gap-6">
          {lifts.map((lift, liftIndex) => (
            <div
              key={lift.name}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="text-2xl font-bold">{lift.name}</h2>
              <p className="mt-2 text-slate-300">
                Current Working Weight:{" "}
                <span className="font-bold text-white">{lift.workingWeight} lb</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {lift.setCount === 1 ? "This lift is 1x5." : "This lift is 5x5."}
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {[0, 1, 2, 3, 4].map((setIndex) => {
                  const disabled = setIndex >= lift.setCount;

                  return (
                    <div
                      key={setIndex}
                      className={`rounded-xl border p-4 ${
                        disabled
                          ? "border-slate-800 bg-slate-950 opacity-50"
                          : "border-slate-700 bg-slate-950"
                      }`}
                    >
                      <p className="mb-3 font-semibold">Set {setIndex + 1}</p>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => updateSet(liftIndex, setIndex, -1)}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-lg font-bold disabled:opacity-40"
                        >
                          -
                        </button>

                        <span className="text-2xl font-bold">{lift.sets[setIndex]}</span>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => updateSet(liftIndex, setIndex, 1)}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-lg font-bold disabled:opacity-40"
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
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving || message.includes("already submitted")}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Strength Workout"}
          </button>
        </div>

        {message && <p className="mt-4 text-slate-300">{message}</p>}
      </div>
    </main>
  );
}