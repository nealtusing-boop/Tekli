"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { CONDITIONING_EVENTS, ConditioningEventKey } from "../../lib/schedule";
import { getWeekStartDate } from "../../lib/date";

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

  function parseNumberInput(value: string) {
    if (value === "") return 0;
    return Number(value);
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

        const totalSeconds = Math.max(0, minutes * 60 + seconds);

        const { error } = await supabase.from("conditioning_logs").insert({
          user_id: userId,
          profile_name: profileName,
          event_name: eventKey,
          score_type: "time",
          week_start_date: weekStartDate,
          minutes,
          seconds,
          total_seconds: totalSeconds,
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
    } catch (error: any) {
      setMessage(error?.message || "Failed to save conditioning workout.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-4xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl">
        <AppNav />

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">{eventConfig.label}</h1>
          <p className="mt-2 text-slate-300">{eventConfig.description}</p>

          {eventConfig.type === "time" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Minutes</label>
                <input
                  type="number"
                  min={0}
                  value={minutes === 0 ? "" : minutes}
                  onChange={(e) => setMinutes(parseNumberInput(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Seconds</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={seconds === 0 ? "" : seconds}
                  onChange={(e) => setSeconds(parseNumberInput(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Rounds</label>
                  <input
                    type="number"
                    min={0}
                    value={rounds === 0 ? "" : rounds}
                    onChange={(e) => setRounds(parseNumberInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Extra Reps</label>
                  <input
                    type="number"
                    min={0}
                    max={44}
                    value={extraReps === 0 ? "" : extraReps}
                    onChange={(e) => setExtraReps(parseNumberInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Prescribed or Scaled/Modified
                </label>
                <select
                  value={effortStyle}
                  onChange={(e) => setEffortStyle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                >
                  <option value="prescribed">Prescribed</option>
                  <option value="scaled_modified">Scaled/Modified</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="List weights used, substitutions, or modifications."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || message.includes("already submitted")}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Workout"}
          </button>

          {message && <p className="mt-4 text-slate-300">{message}</p>}
        </div>
      </div>
    </main>
  );
}