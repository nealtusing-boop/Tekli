"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { calculateCurrentStreak } from "../../lib/streaks";
import { formatSeconds } from "../../lib/date";

type StrengthLog = {
  id: string;
  user_id: string;
  logged_at: string;
  week_start_date: string;
  workout_day: string;
  lift_1: any;
  lift_2: any;
  lift_3: any;
};

type ConditioningLog = {
  id: string;
  user_id: string;
  event_name: string;
  total_seconds: number | null;
  total_reps: number | null;
  rounds: number | null;
  extra_reps: number | null;
  effort_style: string | null;
  notes: string | null;
  logged_at: string;
  week_start_date: string;
};

type LiftSetting = {
  lift_name: string;
  current_weight: number;
};

export default function StatsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [strengthLogs, setStrengthLogs] = useState<StrengthLog[]>([]);
  const [conditioningLogs, setConditioningLogs] = useState<ConditioningLog[]>([]);
  const [liftSettings, setLiftSettings] = useState<LiftSetting[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function loadStats() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: strengthData } = await supabase
        .from("strength_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      const { data: conditioningData } = await supabase
        .from("conditioning_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      const { data: liftSettingsData } = await supabase
        .from("lift_settings")
        .select("lift_name, current_weight")
        .eq("user_id", user.id);

      setStrengthLogs(strengthData || []);
      setConditioningLogs(conditioningData || []);
      setLiftSettings(liftSettingsData || []);
      setLoading(false);
    }

    loadStats();
  }, [router]);

  const latestLiftMap: Record<string, number> = {};

  for (const log of strengthLogs) {
    const lifts = [log.lift_1, log.lift_2, log.lift_3];

    for (const lift of lifts) {
      if (lift?.name && latestLiftMap[lift.name] === undefined) {
        latestLiftMap[lift.name] = lift.working_weight || 0;
      }
    }
  }

  const nextLiftMap: Record<string, number> = {};
  for (const row of liftSettings) {
    nextLiftMap[row.lift_name] = row.current_weight || 0;
  }

  const latestConditioningMap: Record<string, ConditioningLog> = {};

  for (const log of conditioningLogs) {
    if (!latestConditioningMap[log.event_name]) {
      latestConditioningMap[log.event_name] = log;
    }
  }

  const streak =
    userId.length > 0
      ? calculateCurrentStreak(strengthLogs, conditioningLogs, userId)
      : 0;

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-6xl">Loading...</div>
      </main>
    );
  }

  function amrapDisplay(log?: ConditioningLog) {
    if (!log) return "—";
    return `${log.rounds || 0} rounds + ${log.extra_reps || 0} reps (${log.total_reps || 0} total)`;
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <h1 className="mb-6 text-3xl font-bold">Stats</h1>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Current Streak</p>
            <p className="mt-2 text-3xl font-bold">{streak} weeks</p>
          </div>
        </div>

        <h2 className="mb-4 text-2xl font-bold">Lift Progress</h2>
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            "Back Squat",
            "Bench Press",
            "Barbell Row",
            "Front Squat",
            "Overhead Press",
            "Deadlift",
          ].map((liftName) => (
            <div
              key={liftName}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-slate-400">{liftName}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Last Weight</span>
                  <span className="text-xl font-bold text-white">
                    {latestLiftMap[liftName] ?? 0} lb
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Next Weight</span>
                  <span className="text-xl font-bold text-white">
                    {nextLiftMap[liftName] ?? 0} lb
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mb-4 text-2xl font-bold">Most Recent Conditioning Scores</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">5 Mile Run</p>
            <p className="mt-2 text-2xl font-bold">
              {formatSeconds(latestConditioningMap["5_mile_run"]?.total_seconds)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Murph</p>
            <p className="mt-2 text-2xl font-bold">
              {formatSeconds(latestConditioningMap["murph"]?.total_seconds)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Ruck</p>
            <p className="mt-2 text-2xl font-bold">
              {formatSeconds(latestConditioningMap["ruck"]?.total_seconds)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">AMRAP #1</p>
            <p className="mt-2 text-lg font-bold">
              {amrapDisplay(latestConditioningMap["amrap_1"])}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">AMRAP #2</p>
            <p className="mt-2 text-lg font-bold">
              {amrapDisplay(latestConditioningMap["amrap_2"])}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}