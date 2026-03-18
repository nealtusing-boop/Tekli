"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { formatDateTime, formatSeconds } from "../../lib/date";

type StrengthLog = {
  id: string;
  logged_at: string;
  workout_day: string;
  lift_1: any;
  lift_2: any;
  lift_3: any;
};

type ConditioningLog = {
  id: string;
  logged_at: string;
  event_name: string;
  total_seconds: number | null;
  rounds: number | null;
  extra_reps: number | null;
  total_reps: number | null;
  effort_style: string | null;
  notes: string | null;
};

type HistoryItem = {
  id: string;
  logged_at: string;
  type: string;
  title: string;
  detail: string;
  badge: string;
};

export default function HistoryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [strengthLogs, setStrengthLogs] = useState<StrengthLog[]>([]);
  const [conditioningLogs, setConditioningLogs] = useState<ConditioningLog[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    async function loadHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: strengthData } = await supabase
        .from("strength_logs")
        .select("*")
        .eq("user_id", user.id);

      const { data: conditioningData } = await supabase
        .from("conditioning_logs")
        .select("*")
        .eq("user_id", user.id);

      setStrengthLogs(strengthData || []);
      setConditioningLogs(conditioningData || []);
      setLoading(false);
    }

    loadHistory();
  }, [router]);

  const historyItems = useMemo(() => {
    const strengthItems: HistoryItem[] = strengthLogs.map((log) => ({
      id: `strength-${log.id}`,
      logged_at: log.logged_at,
      type: `${log.workout_day}_strength`,
      badge: "Strength",
      title:
        log.workout_day === "tuesday" ? "Tuesday Strength" : "Thursday Strength",
      detail: [
        `${log.lift_1?.name}: ${log.lift_1?.working_weight || 0} lb`,
        `${log.lift_2?.name}: ${log.lift_2?.working_weight || 0} lb`,
        `${log.lift_3?.name}: ${log.lift_3?.working_weight || 0} lb`,
      ].join(" • "),
    }));

    const conditioningItems: HistoryItem[] = conditioningLogs.map((log) => {
      const labelMap: Record<string, string> = {
        "5_mile_run": "5 Mile Run",
        murph: "Murph",
        ruck: "Ruck",
        amrap_1: "AMRAP #1",
        amrap_2: "AMRAP #2",
      };

      let detail = "";

      if (log.event_name === "amrap_1" || log.event_name === "amrap_2") {
        detail = `${log.rounds || 0} rounds + ${log.extra_reps || 0} reps (${log.total_reps || 0} total)`;

        if (log.effort_style) {
          detail += ` • ${log.effort_style}`;
        }

        if (log.notes) {
          detail += ` • Notes: ${log.notes}`;
        }
      } else {
        detail = formatSeconds(log.total_seconds);
      }

      return {
        id: `conditioning-${log.id}`,
        logged_at: log.logged_at,
        type: log.event_name,
        badge: "Conditioning",
        title: labelMap[log.event_name] || log.event_name,
        detail,
      };
    });

    let allItems = [...strengthItems, ...conditioningItems];

    if (filterType !== "all") {
      allItems = allItems.filter((item) => item.type === filterType);
    }

    allItems.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime();
      }

      if (sortBy === "oldest") {
        return new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime();
      }

      return a.title.localeCompare(b.title);
    });

    return allItems;
  }, [strengthLogs, conditioningLogs, sortBy, filterType]);

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
              <p className="squad-label">Training Archive</p>
              <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                History
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Review your past sessions, filter by workout type, and track what
                you’ve completed over time.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Entries
              </p>
              <p className="mt-2 text-3xl font-bold">{historyItems.length}</p>
            </div>
          </div>
        </section>

        <section className="squad-card p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="squad-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="type">Workout Type</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">
                Filter
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="squad-select"
              >
                <option value="all">All Workouts</option>
                <option value="tuesday_strength">Tuesday Strength</option>
                <option value="thursday_strength">Thursday Strength</option>
                <option value="5_mile_run">5 Mile Run</option>
                <option value="murph">Murph</option>
                <option value="ruck">Ruck</option>
                <option value="amrap_1">AMRAP #1</option>
                <option value="amrap_2">AMRAP #2</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {historyItems.length === 0 ? (
            <div className="squad-empty">
              No history yet. Once you start logging workouts, they’ll appear here.
            </div>
          ) : (
            historyItems.map((item) => (
              <article key={item.id} className="squad-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                        {item.badge}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight">
                      {item.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                      {item.detail}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {formatDateTime(item.logged_at)}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}