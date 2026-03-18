"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { formatSeconds } from "../../lib/date";
import { calculateCurrentStreak } from "../../lib/streaks";

type StrengthLog = {
  user_id: string;
  profile_name: string;
  week_start_date: string;
  workout_day: string;
};

type ConditioningLog = {
  user_id: string;
  profile_name: string;
  event_name: string;
  total_seconds: number | null;
  total_reps: number | null;
  week_start_date: string;
};

type LeaderRow = {
  user_id: string;
  profile_name: string;
  value: number;
};

export default function LeaderboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [strengthLogs, setStrengthLogs] = useState<StrengthLog[]>([]);
  const [conditioningLogs, setConditioningLogs] = useState<ConditioningLog[]>(
    []
  );

  useEffect(() => {
    async function loadLeaderboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: strengthData } = await supabase
        .from("strength_logs")
        .select("user_id, profile_name, week_start_date, workout_day");

      const { data: conditioningData } = await supabase
        .from("conditioning_logs")
        .select(
          "user_id, profile_name, event_name, total_seconds, total_reps, week_start_date"
        );

      setStrengthLogs(strengthData || []);
      setConditioningLogs(conditioningData || []);
      setLoading(false);
    }

    loadLeaderboard();
  }, [router]);

  function bestTimeFor(eventName: string) {
    const bestByUser = new Map<string, LeaderRow>();

    conditioningLogs
      .filter((log) => log.event_name === eventName && log.total_seconds !== null)
      .forEach((log) => {
        const current = bestByUser.get(log.user_id);
        const value = log.total_seconds || 0;

        if (!current || value < current.value) {
          bestByUser.set(log.user_id, {
            user_id: log.user_id,
            profile_name: log.profile_name,
            value,
          });
        }
      });

    return Array.from(bestByUser.values()).sort((a, b) => a.value - b.value);
  }

  function bestAmrapFor(eventName: string) {
    const bestByUser = new Map<string, LeaderRow>();

    conditioningLogs
      .filter((log) => log.event_name === eventName && log.total_reps !== null)
      .forEach((log) => {
        const current = bestByUser.get(log.user_id);
        const value = log.total_reps || 0;

        if (!current || value > current.value) {
          bestByUser.set(log.user_id, {
            user_id: log.user_id,
            profile_name: log.profile_name,
            value,
          });
        }
      });

    return Array.from(bestByUser.values()).sort((a, b) => b.value - a.value);
  }

  function longestStreaks() {
    const users = new Map<string, string>();

    strengthLogs.forEach((log) => users.set(log.user_id, log.profile_name));
    conditioningLogs.forEach((log) => users.set(log.user_id, log.profile_name));

    const rows: LeaderRow[] = [];

    users.forEach((profile_name, user_id) => {
      rows.push({
        user_id,
        profile_name,
        value: calculateCurrentStreak(strengthLogs, conditioningLogs, user_id),
      });
    });

    return rows.sort((a, b) => b.value - a.value);
  }

  const runLeaders = bestTimeFor("5_mile_run");
  const murphLeaders = bestTimeFor("murph");
  const ruckLeaders = bestTimeFor("ruck");
  const amrap1Leaders = bestAmrapFor("amrap_1");
  const amrap2Leaders = bestAmrapFor("amrap_2");
  const streakLeaders = longestStreaks();

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-6xl">Loading...</div>
      </main>
    );
  }

  function getRowStyle(index: number) {
    if (index === 0) {
      return "border-yellow-400 bg-yellow-400/10";
    }

    if (index === 1) {
      return "border-slate-300 bg-slate-300/10";
    }

    if (index === 2) {
      return "border-amber-700 bg-amber-700/10";
    }

    return "border-slate-800 bg-slate-950";
  }

  function getRankLabel(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  }

  function LeaderboardSection({
    title,
    rows,
    formatter,
  }: {
    title: string;
    rows: LeaderRow[];
    formatter: (value: number) => string;
  }) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>

        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-slate-400">No data yet.</p>
          ) : (
            rows.slice(0, 10).map((row, index) => (
              <div
                key={`${title}-${row.user_id}`}
                className={`flex items-center justify-between rounded-2xl border p-4 transition ${getRowStyle(
                  index
                )}`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-[52px] text-lg font-bold">
                    {getRankLabel(index)}
                  </div>

                  <div>
                    <p className="font-bold">{row.profile_name}</p>
                    {index < 3 && (
                      <p className="text-sm text-slate-300">Top performer</p>
                    )}
                  </div>
                </div>

                <div className="text-right text-lg font-bold">
                  {formatter(row.value)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <AppNav />

        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Squad Results
          </p>
          <h1 className="mt-2 text-4xl font-bold">Leaderboard</h1>
          <p className="mt-3 text-slate-300">
            Best scores across the squad for timed events, AMRAPs, and streaks.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LeaderboardSection
            title="Fastest 5 Mile Run"
            rows={runLeaders}
            formatter={(value) => formatSeconds(value)}
          />

          <LeaderboardSection
            title="Fastest Murph"
            rows={murphLeaders}
            formatter={(value) => formatSeconds(value)}
          />

          <LeaderboardSection
            title="Fastest Ruck"
            rows={ruckLeaders}
            formatter={(value) => formatSeconds(value)}
          />

          <LeaderboardSection
            title="Highest AMRAP #1"
            rows={amrap1Leaders}
            formatter={(value) => `${value} reps`}
          />

          <LeaderboardSection
            title="Highest AMRAP #2"
            rows={amrap2Leaders}
            formatter={(value) => `${value} reps`}
          />

          <LeaderboardSection
            title="Longest Streak"
            rows={streakLeaders}
            formatter={(value) => `${value} weeks`}
          />
        </div>
      </div>
    </main>
  );
}