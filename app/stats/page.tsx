"use client";

import { useEffect, useMemo, useState } from "react";
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

const LIFTS = [
  "Back Squat",
  "Bench Press",
  "Barbell Row",
  "Front Squat",
  "Overhead Press",
  "Deadlift",
];

const CONDITIONING_CARDS = [
  { key: "5_mile_run", label: "5 Mile Run", kind: "time" },
  { key: "murph", label: "Murph", kind: "time" },
  { key: "ruck", label: "Ruck", kind: "time" },
  { key: "amrap_1", label: "AMRAP #1", kind: "amrap" },
  { key: "amrap_2", label: "AMRAP #2", kind: "amrap" },
] as const;

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

  const latestLiftMap = useMemo(() => {
    const map: Record<string, number> = {};

    for (const log of strengthLogs) {
      const lifts = [log.lift_1, log.lift_2, log.lift_3];

      for (const lift of lifts) {
        if (lift?.name && map[lift.name] === undefined) {
          map[lift.name] = lift.working_weight || 0;
        }
      }
    }

    return map;
  }, [strengthLogs]);

  const nextLiftMap = useMemo(() => {
    const map: Record<string, number> = {};

    for (const row of liftSettings) {
      map[row.lift_name] = row.current_weight || 0;
    }

    return map;
  }, [liftSettings]);

  const latestConditioningMap = useMemo(() => {
    const map: Record<string, ConditioningLog> = {};

    for (const log of conditioningLogs) {
      if (!map[log.event_name]) {
        map[log.event_name] = log;
      }
    }

    return map;
  }, [conditioningLogs]);

  const streak =
    userId.length > 0
      ? calculateCurrentStreak(strengthLogs, conditioningLogs, userId)
      : 0;

  const totalStrengthSessions = strengthLogs.length;
  const totalConditioningSessions = conditioningLogs.length;
  const totalSessions = totalStrengthSessions + totalConditioningSessions;

  if (loading) {
    return (
      <main className="squad-shell py-6">
        <div className="squad-card p-6">Loading...</div>
      </main>
    );
  }

  function amrapDisplay(log?: ConditioningLog) {
    if (!log) return "No score yet";
    return `${log.rounds || 0} rounds + ${log.extra_reps || 0} reps`;
  }

  function amrapSubtext(log?: ConditioningLog) {
    if (!log) return "Complete this workout to see your latest result.";
    return `${log.total_reps || 0} total reps`;
  }

  function timeDisplay(log?: ConditioningLog) {
    if (!log) return "No time yet";
    return formatSeconds(log.total_seconds);
  }

  function timeSubtext(log?: ConditioningLog) {
    if (!log) return "Complete this workout to see your latest result.";
    return "Most recent score";
  }

  return (
    <main className="squad-shell py-4 sm:py-6">
      <div className="squad-page-stack">
        <AppNav />

        <section className="squad-card overflow-hidden p-5 sm:p-7">
          <div className="max-w-2xl">
            <p className="squad-label">Performance</p>
            <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Stats
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Your training dashboard for streaks, lift progression, and latest
              conditioning scores.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="squad-card p-5 sm:p-6">
            <p className="squad-label">Streak</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold tracking-tight sm:text-6xl">
                  {streak}
                </p>
                <p className="mt-2 text-base text-slate-300">
                  {streak === 1 ? "day" : "days"}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Active
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {streak === 0
                    ? "Restart"
                    : streak < 5
                    ? "Building"
                    : streak < 15
                    ? "Strong"
                    : "Locked In"}
                </p>
              </div>
            </div>
          </div>

          <div className="squad-card p-5 sm:p-6">
            <p className="squad-label">Training Split</p>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">Strength</span>
                  <span className="font-semibold text-white">
                    {totalStrengthSessions}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                    style={{
                      width:
                        totalSessions === 0
                          ? "0%"
                          : `${(totalStrengthSessions / totalSessions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">Conditioning</span>
                  <span className="font-semibold text-white">
                    {totalConditioningSessions}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{
                      width:
                        totalSessions === 0
                          ? "0%"
                          : `${(totalConditioningSessions / totalSessions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="squad-page-stack">
          <div>
            <p className="squad-label">Strength</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Lift Progress
            </h2>
          </div>

          <div className="squad-grid-cards">
            {LIFTS.map((liftName) => {
              const lastWeight = latestLiftMap[liftName] ?? 0;
              const nextWeight = nextLiftMap[liftName] ?? 0;
              const isMoving = nextWeight > lastWeight;

              return (
                <div key={liftName} className="squad-card p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {liftName}
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isMoving
                          ? "bg-emerald-400/12 text-emerald-300"
                          : "bg-white/6 text-slate-300"
                      }`}
                    >
                      {isMoving ? "Progressing" : "Set"}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Last
                      </p>
                      <p className="mt-3 text-3xl font-bold">{lastWeight}</p>
                      <p className="mt-1 text-sm text-slate-400">lb</p>
                    </div>

                    <div className="rounded-2xl border border-blue-400/18 bg-blue-500/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-blue-200">
                        Next
                      </p>
                      <p className="mt-3 text-3xl font-bold">{nextWeight}</p>
                      <p className="mt-1 text-sm text-slate-300">lb</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="squad-page-stack">
          <div>
            <p className="squad-label">Conditioning</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Most Recent Scores
            </h2>
          </div>

          <div className="squad-grid-cards">
            {CONDITIONING_CARDS.map((card) => {
              const log = latestConditioningMap[card.key];

              return (
                <div key={card.key} className="squad-card p-5 sm:p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {card.label}
                  </p>

                  <p className="mt-5 text-3xl font-bold tracking-tight">
                    {card.kind === "time" ? timeDisplay(log) : amrapDisplay(log)}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {card.kind === "time" ? timeSubtext(log) : amrapSubtext(log)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}