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

type LeaderboardSectionProps = {
  title: string;
  subtitle: string;
  rows: LeaderRow[];
  formatter: (value: number) => string;
};

function rankBadge(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function rankCardClass(index: number) {
  if (index === 0) {
    return "border-yellow-300/30 bg-yellow-300/10";
  }

  if (index === 1) {
    return "border-slate-200/20 bg-slate-200/8";
  }

  if (index === 2) {
    return "border-amber-500/25 bg-amber-500/10";
  }

  return "border-white/8 bg-white/4";
}

function LeaderboardSection({
  title,
  subtitle,
  rows,
  formatter,
}: LeaderboardSectionProps) {
  const topThree = rows.slice(0, 3);
  const rest = rows.slice(3, 10);

  return (
    <section className="squad-card p-5 sm:p-6">
      <div className="mb-5">
        <p className="squad-label">Leaderboard</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <div className="squad-empty">
          No data yet. Once the squad starts logging scores, rankings will show
          here.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {topThree.map((row, index) => (
              <div
                key={`${title}-${row.user_id}`}
                className={`rounded-3xl border p-4 sm:p-5 ${rankCardClass(index)}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 text-xl font-bold">
                      {rankBadge(index)}
                    </div>

                    <div>
                      <p className="text-lg font-bold">{row.profile_name}</p>
                      <p className="text-sm text-slate-300">Top performer</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatter(row.value)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="rounded-3xl border border-white/8 bg-black/18 p-3">
              <div className="space-y-2">
                {rest.map((row, index) => (
                  <div
                    key={`${title}-rest-${row.user_id}`}
                    className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/4 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-[40px] text-sm font-semibold text-slate-300">
                        #{index + 4}
                      </div>
                      <p className="font-semibold text-white">{row.profile_name}</p>
                    </div>

                    <p className="font-bold text-white">{formatter(row.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function bestTimeFor(
  conditioningLogs: ConditioningLog[],
  eventName: string
): LeaderRow[] {
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

function bestAmrapFor(
  conditioningLogs: ConditioningLog[],
  eventName: string
): LeaderRow[] {
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

function longestStreaks(
  strengthLogs: StrengthLog[],
  conditioningLogs: ConditioningLog[]
): LeaderRow[] {
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

  const runLeaders = bestTimeFor(conditioningLogs, "5_mile_run");
  const murphLeaders = bestTimeFor(conditioningLogs, "murph");
  const ruckLeaders = bestTimeFor(conditioningLogs, "ruck");
  const amrap1Leaders = bestAmrapFor(conditioningLogs, "amrap_1");
  const amrap2Leaders = bestAmrapFor(conditioningLogs, "amrap_2");
  const streakLeaders = longestStreaks(strengthLogs, conditioningLogs);

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
          <div className="max-w-2xl">
            <p className="squad-label">Squad Results</p>
            <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Compare the squad’s best times, top AMRAPs, and longest active
              streaks.
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <LeaderboardSection
            title="Fastest 5 Mile Run"
            subtitle="Lowest time wins."
            rows={runLeaders}
            formatter={(value) => formatSeconds(value)}
          />

          <LeaderboardSection
            title="Fastest Murph"
            subtitle="Lowest time wins."
            rows={murphLeaders}
            formatter={(value) => formatSeconds(value)}
          />

          <LeaderboardSection
            title="Fastest Ruck"
            subtitle="Lowest time wins."
            rows={ruckLeaders}
            formatter={(value) => formatSeconds(value)}
          />

          <LeaderboardSection
            title="Highest AMRAP #1"
            subtitle="Highest total reps wins."
            rows={amrap1Leaders}
            formatter={(value) => `${value} reps`}
          />

          <LeaderboardSection
            title="Highest AMRAP #2"
            subtitle="Highest total reps wins."
            rows={amrap2Leaders}
            formatter={(value) => `${value} reps`}
          />

          <LeaderboardSection
            title="Longest Streak"
            subtitle="Most consecutive completed training days."
            rows={streakLeaders}
            formatter={(value) => `${value} days`}
          />
        </div>
      </div>
    </main>
  );
}