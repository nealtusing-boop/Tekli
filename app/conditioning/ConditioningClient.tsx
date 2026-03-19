"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { CONDITIONING_EVENTS, ConditioningEventKey } from "../../lib/schedule";
import { getWeekStartDate } from "../../lib/date";

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  minLabel,
  maxLabel,
  disabled = false,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/4 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-100">{label}</label>
        {(minLabel || maxLabel) && (
          <span className="text-xs text-slate-400">
            {minLabel || ""}
            {minLabel && maxLabel ? " • " : ""}
            {maxLabel || ""}
          </span>
        )}
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

export default function ConditioningClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [profileName, setProfileName] = useState("");

  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [rounds, setRounds] = useState<number>(0);
  const [extraReps, setExtraReps] = useState<number>(0);
  const [effortStyle, setEffortStyle] = useState("prescribed");
  const [notes, setNotes] = useState("");

  const eventParam = searchParams.get("event") as ConditioningEventKey | null;
  const eventKey: ConditioningEventKey =
    eventParam && CONDITIONING_EVENTS[eventParam] ? eventParam : "5_mile_run";

  const eventConfig = CONDITIONING_EVENTS[eventKey];
  const weekStartDate = useMemo(() => getWeekStartDate(), []);

  const alreadySubmitted = message.includes("already submitted");
  const isTimeWorkout = eventConfig.type === "time";
  const totalAmrapReps = rounds * 45 + extraReps;

  const eventMeta = useMemo(() => {
    switch (eventKey) {
      case "5_mile_run":
        return {
          badge: "Distance",
          badgeValue: "5 miles",
          secondaryBadge: null,
          accent: "from-cyan-400/20 to-blue-500/15",
          helper: "Enter your finishing time.",
        };
      case "murph":
        return {
          badge: "Benchmark",
          badgeValue: "Murph",
          secondaryBadge: null,
          accent: "from-blue-400/20 to-indigo-500/15",
          helper: "Enter your finishing time.",
        };
      case "ruck":
        return {
          badge: "Load",
          badgeValue: "40 lbs",
          secondaryBadge: {
            label: "Distance",
            value: "4.5 miles",
          },
          accent: "from-emerald-400/20 to-blue-500/15",
          helper: "Enter your finishing time.",
        };
      case "amrap_1":
      case "amrap_2":
        return {
          badge: "Window",
          badgeValue: "15 min",
          secondaryBadge: null,
          accent:
            eventKey === "amrap_1"
              ? "from-blue-400/20 to-cyan-500/15"
              : "from-indigo-400/20 to-blue-500/15",
          helper: "Log rounds, extra reps, and whether it was prescribed.",
        };
      default:
        return {
          badge: "Workout",
          badgeValue: "Session",
          secondaryBadge: null,
          accent: "from-blue-400/20 to-cyan-500/15",
          helper: "",
        };
    }
  }, [eventKey]);

  const amrapDetails = useMemo(() => {
    if (eventConfig.type !== "amrap") return null;

    return {
      title: "Workout",
      subtitle: eventConfig.title,
      movements: eventConfig.description.filter(
        (line) => line && line !== "15 Minute AMRAP"
      ),
    };
  }, [eventConfig]);

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

      const { data: existingLog } = await supabase
        .from("conditioning_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate)
        .eq("event_name", eventKey)
        .maybeSingle();

      if (existingLog) {
        setMessage("You already submitted this workout for this week.");
      }

      setLoading(false);
    }

    loadPage();
  }, [eventKey, router, weekStartDate]);

  function adjustValue(
    current: number,
    delta: number,
    min: number,
    max?: number
  ) {
    const next = current + delta;

    if (next < min) return min;
    if (typeof max === "number" && next > max) return max;

    return next;
  }

  async function handleSave() {
    if (!userId || !profileName) {
      setMessage("Could not load your profile.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (eventConfig.type === "time") {
        if (seconds < 0 || seconds > 59) {
          throw new Error("Seconds must be between 0 and 59.");
        }

        const safeTotalSeconds = Math.max(0, minutes * 60 + seconds);

        const { error } = await supabase.from("conditioning_logs").insert({
          user_id: userId,
          profile_name: profileName,
          event_name: eventKey,
          score_type: "time",
          week_start_date: weekStartDate,
          minutes,
          seconds,
          total_seconds: safeTotalSeconds,
        });

        if (error) throw error;
      } else {
        if (extraReps < 0 || extraReps > 44) {
          throw new Error("Extra reps must be between 0 and 44.");
        }

        const totalReps = rounds * 45 + extraReps;

        const { error } = await supabase.from("conditioning_logs").insert({
          user_id: userId,
          profile_name: profileName,
          event_name: eventKey,
          score_type: "amrap",
          week_start_date: weekStartDate,
          rounds,
          extra_reps: extraReps,
          total_reps: totalReps,
          effort_style: effortStyle,
          notes,
        });

        if (error) throw error;
      }

      setMessage("Conditioning workout saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save conditioning workout."
      );
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
              <p className="squad-label">Conditioning Session</p>
              <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                {eventConfig.label}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                {eventMeta.helper}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-3xl border border-white/8 bg-gradient-to-br ${eventMeta.accent} px-5 py-4`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  {eventMeta.badge}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {eventMeta.badgeValue}
                </p>
              </div>

              {eventMeta.secondaryBadge && (
                <div className="rounded-3xl border border-white/8 bg-white/4 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                    {eventMeta.secondaryBadge.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {eventMeta.secondaryBadge.value}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {amrapDetails && (
          <section className="squad-card p-5 sm:p-6">
            <div className="mb-4">
              <p className="squad-label">{amrapDetails.title}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {amrapDetails.subtitle}
              </h2>
            </div>

            <div className="grid gap-3">
              {amrapDetails.movements.map((movement) => (
                <div
                  key={movement}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-base font-semibold text-white sm:px-5"
                >
                  {movement}
                </div>
              ))}
            </div>
          </section>
        )}

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
                Type
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {isTimeWorkout ? "For time" : "AMRAP"}
              </p>
            </div>
          </div>

          {isTimeWorkout ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Stepper
                  label="Minutes"
                  value={minutes}
                  onDecrease={() =>
                    setMinutes((current) => adjustValue(current, -1, 0))
                  }
                  onIncrease={() =>
                    setMinutes((current) => adjustValue(current, 1, 0))
                  }
                  minLabel="Min 0"
                  disabled={saving || alreadySubmitted}
                />

                <Stepper
                  label="Seconds"
                  value={seconds}
                  onDecrease={() =>
                    setSeconds((current) => adjustValue(current, -1, 0, 59))
                  }
                  onIncrease={() =>
                    setSeconds((current) => adjustValue(current, 1, 0, 59))
                  }
                  minLabel="Min 0"
                  maxLabel="Max 59"
                  disabled={saving || alreadySubmitted}
                />
              </div>

              <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
                <p className="text-sm font-semibold text-slate-300">
                  Time Preview
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Stepper
                  label="Rounds"
                  value={rounds}
                  onDecrease={() =>
                    setRounds((current) => adjustValue(current, -1, 0))
                  }
                  onIncrease={() =>
                    setRounds((current) => adjustValue(current, 1, 0))
                  }
                  minLabel="Min 0"
                  disabled={saving || alreadySubmitted}
                />

                <Stepper
                  label="Extra Reps"
                  value={extraReps}
                  onDecrease={() =>
                    setExtraReps((current) => adjustValue(current, -1, 0, 44))
                  }
                  onIncrease={() =>
                    setExtraReps((current) => adjustValue(current, 1, 0, 44))
                  }
                  minLabel="Min 0"
                  maxLabel="Max 44"
                  disabled={saving || alreadySubmitted}
                />
              </div>

              <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
                <p className="text-sm font-semibold text-slate-300">
                  Score Preview
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {rounds} rounds + {extraReps} reps
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Total reps: {totalAmrapReps}
                </p>
              </div>

              <div className="squad-segmented">
                <button
                  type="button"
                  onClick={() => setEffortStyle("prescribed")}
                  disabled={saving || alreadySubmitted}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    effortStyle === "prescribed"
                      ? "border-blue-400/40 bg-blue-500/12 text-white"
                      : "border-white/8 bg-white/4 text-slate-300 hover:bg-white/7"
                  }`}
                >
                  <p className="text-sm font-semibold">Prescribed</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Logged as written
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEffortStyle("scaled_modified")}
                  disabled={saving || alreadySubmitted}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    effortStyle === "scaled_modified"
                      ? "border-blue-400/40 bg-blue-500/12 text-white"
                      : "border-white/8 bg-white/4 text-slate-300 hover:bg-white/7"
                  }`}
                >
                  <p className="text-sm font-semibold">Scaled / Modified</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Different movement or load
                  </p>
                </button>
              </div>

              <div className="squad-subtle-divider" />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-100">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="List weights used, substitutions, or modifications."
                  className="squad-textarea"
                  disabled={saving || alreadySubmitted}
                />
              </div>
            </div>
          )}

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