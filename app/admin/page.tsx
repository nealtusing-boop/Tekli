"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";
import { formatDateTime, formatSeconds } from "../../lib/date";
import {
  CONDITIONING_EVENTS,
  ConditioningEventKey,
} from "../../lib/schedule";

type Profile = {
  id: string;
  profile_name: string;
};

type LiftLogEntry = {
  name: string;
  working_weight: number;
  set_count?: number;
  sets?: number[];
  completed?: boolean;
  next_weight?: number;
};

type LiftSettingRow = {
  lift_name: string;
  current_weight: number | null;
};

type StrengthLog = {
  id: string;
  user_id: string;
  logged_at: string;
  week_start_date: string;
  workout_day: string;
  lift_1: LiftLogEntry | null;
  lift_2: LiftLogEntry | null;
  lift_3: LiftLogEntry | null;
};

type ConditioningLog = {
  id: string;
  user_id: string;
  event_name: ConditioningEventKey;
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
] as const;

const CONDITIONING_CARDS = [
  { key: "5_mile_run", label: "5 Mile Run", kind: "time" },
  { key: "murph", label: "Murph", kind: "time" },
  { key: "ruck", label: "40 lb Ruck", kind: "time" },
  { key: "amrap_1", label: "AMRAP #1", kind: "amrap" },
  { key: "amrap_2", label: "AMRAP #2", kind: "amrap" },
] as const;

function formatStrengthTitle(workoutDay: string) {
  if (workoutDay === "tuesday") return "Tuesday Strength";
  if (workoutDay === "thursday") return "Thursday Strength";
  if (workoutDay === "monday") return "Monday Strength";
  return "Strength";
}

function formatStrengthDetail(log: StrengthLog) {
  const lifts = [log.lift_1, log.lift_2, log.lift_3].filter(
    (lift): lift is LiftLogEntry => Boolean(lift)
  );

  return lifts
    .map((lift) => `${lift.name}: ${lift.working_weight || 0} lb`)
    .join(" • ");
}

function formatConditioningDetail(log: ConditioningLog) {
  if (log.event_name === "amrap_1" || log.event_name === "amrap_2") {
    let detail = `${log.rounds || 0} rounds + ${log.extra_reps || 0} reps (${log.total_reps || 0} total)`;

    if (log.effort_style) {
      detail += ` • ${log.effort_style}`;
    }

    if (log.notes) {
      detail += ` • Notes: ${log.notes}`;
    }

    return detail;
  }

  return formatSeconds(log.total_seconds);
}

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({
    "Back Squat": 0,
    "Bench Press": 0,
    "Barbell Row": 0,
    "Front Squat": 0,
    "Overhead Press": 0,
    Deadlift: 0,
  });

  const [strengthLogs, setStrengthLogs] = useState<StrengthLog[]>([]);
  const [conditioningLogs, setConditioningLogs] = useState<ConditioningLog[]>(
    []
  );
  const [liftSettings, setLiftSettings] = useState<LiftSetting[]>([]);

  useEffect(() => {
    async function loadAdminPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: me } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!me?.is_admin) {
        setMessage("You are not authorized to view this page.");
        setLoading(false);
        return;
      }

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, profile_name")
        .order("profile_name", { ascending: true });

      setProfiles(allProfiles || []);
      setLoading(false);
    }

    loadAdminPage();
  }, [router]);

  useEffect(() => {
    async function loadSelectedUserData() {
      if (!selectedUserId) {
        setSelectedUserName("");
        setStrengthLogs([]);
        setConditioningLogs([]);
        setLiftSettings([]);
        setWeights({
          "Back Squat": 0,
          "Bench Press": 0,
          "Barbell Row": 0,
          "Front Squat": 0,
          "Overhead Press": 0,
          Deadlift: 0,
        });
        return;
      }

      setDashboardLoading(true);

      const selectedProfile =
        profiles.find((profile) => profile.id === selectedUserId)?.profile_name ||
        "";
      setSelectedUserName(selectedProfile);

      const [strengthResult, conditioningResult, liftSettingsResult] =
        await Promise.all([
          supabase
            .from("strength_logs")
            .select("*")
            .eq("user_id", selectedUserId)
            .order("logged_at", { ascending: false }),
          supabase
            .from("conditioning_logs")
            .select("*")
            .eq("user_id", selectedUserId)
            .order("logged_at", { ascending: false }),
          supabase
            .from("lift_settings")
            .select("lift_name, current_weight")
            .eq("user_id", selectedUserId),
        ]);

      const nextWeights: Record<string, number> = {
        "Back Squat": 0,
        "Bench Press": 0,
        "Barbell Row": 0,
        "Front Squat": 0,
        "Overhead Press": 0,
        Deadlift: 0,
      };

      (liftSettingsResult.data || []).forEach((row: LiftSettingRow) => {
        nextWeights[row.lift_name] = row.current_weight || 0;
      });

      setWeights(nextWeights);
      setStrengthLogs(strengthResult.data || []);
      setConditioningLogs(conditioningResult.data || []);
      setLiftSettings(liftSettingsResult.data || []);
      setDashboardLoading(false);
    }

    loadSelectedUserData();
  }, [selectedUserId, profiles]);

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

  const latestStrengthSession = strengthLogs[0];
  const latestConditioningSession = conditioningLogs[0];

  function parseNumberInput(value: string) {
    if (value === "") return 0;
    return Number(value);
  }

  async function handleSave() {
    if (!selectedUserId) {
      setMessage("Select a user first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const rows = LIFTS.map((liftName) => ({
        user_id: selectedUserId,
        lift_name: liftName,
        current_weight: weights[liftName] || 0,
      }));

      const { error } = await supabase.from("lift_settings").upsert(rows, {
        onConflict: "user_id,lift_name",
      });

      if (error) throw error;

      setLiftSettings(
        rows.map((row) => ({
          lift_name: row.lift_name,
          current_weight: row.current_weight,
        }))
      );

      setMessage("Starting weights saved.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save starting weights."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStrengthLog(log: StrengthLog) {
    const confirmed = window.confirm(
      `Delete this strength log for ${selectedUserName || "this user"}?\n\n${formatStrengthTitle(log.workout_day)}`
    );

    if (!confirmed) return;

    setDeletingId(`strength-${log.id}`);
    setMessage("");

    try {
      const { error } = await supabase
        .from("strength_logs")
        .delete()
        .eq("id", log.id);

      if (error) throw error;

      setStrengthLogs((current) => current.filter((item) => item.id !== log.id));
      setMessage("Strength log deleted.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete strength log."
      );
    } finally {
      setDeletingId("");
    }
  }

  async function handleDeleteConditioningLog(log: ConditioningLog) {
    const confirmed = window.confirm(
      `Delete this conditioning log for ${selectedUserName || "this user"}?\n\n${CONDITIONING_EVENTS[log.event_name].label}`
    );

    if (!confirmed) return;

    setDeletingId(`conditioning-${log.id}`);
    setMessage("");

    try {
      const { error } = await supabase
        .from("conditioning_logs")
        .delete()
        .eq("id", log.id);

      if (error) throw error;

      setConditioningLogs((current) => current.filter((item) => item.id !== log.id));
      setMessage("Conditioning log deleted.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete conditioning log."
      );
    } finally {
      setDeletingId("");
    }
  }

  function amrapDisplay(log?: ConditioningLog) {
    if (!log) return "No score yet";
    return `${log.rounds || 0} rounds + ${log.extra_reps || 0} reps`;
  }

  function amrapSubtext(log?: ConditioningLog) {
    if (!log) return "No result logged yet.";
    return `${log.total_reps || 0} total reps`;
  }

  function timeDisplay(log?: ConditioningLog) {
    if (!log) return "No time yet";
    return formatSeconds(log.total_seconds);
  }

  function timeSubtext(log?: ConditioningLog) {
    if (!log) return "No result logged yet.";
    return "Most recent score";
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
              <p className="squad-label">Admin Controls</p>
              <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Admin
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Select any user to set their lift weights, review their recent logs,
                and delete bad entries when needed.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Users
              </p>
              <p className="mt-2 text-3xl font-bold">{profiles.length}</p>
            </div>
          </div>
        </section>

        <section className="squad-card p-5 sm:p-6">
          <div className="mb-2">
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setMessage("");
              }}
              className="squad-select"
            >
              <option value="">Choose a user</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.profile_name}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          )}
        </section>

        {selectedUserId ? (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="squad-card p-5 sm:p-6 lg:col-span-2">
                <p className="squad-label">Athlete Dashboard</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  {selectedUserName || "Selected User"}
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  Latest training data and current lift settings for this user.
                </p>
              </div>

              <div className="squad-card p-5 sm:p-6">
                <p className="squad-label">Recent Activity</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Latest Strength
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {latestStrengthSession
                        ? formatStrengthTitle(latestStrengthSession.workout_day)
                        : "No strength logs"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {latestStrengthSession
                        ? formatDateTime(latestStrengthSession.logged_at)
                        : "Nothing logged yet"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Latest Conditioning
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {latestConditioningSession
                        ? CONDITIONING_EVENTS[latestConditioningSession.event_name]
                            .label
                        : "No conditioning logs"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {latestConditioningSession
                        ? formatDateTime(latestConditioningSession.logged_at)
                        : "Nothing logged yet"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="squad-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="squad-label">Starting Weights</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight">
                    Lift Settings
                  </h2>
                </div>

                {dashboardLoading && (
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    Loading user data...
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {LIFTS.map((liftName) => (
                  <div
                    key={liftName}
                    className="rounded-3xl border border-white/8 bg-white/4 p-4"
                  >
                    <label className="mb-3 block text-sm font-semibold text-slate-100">
                      {liftName}
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={weights[liftName] === 0 ? "" : weights[liftName]}
                        onChange={(e) =>
                          setWeights((current) => ({
                            ...current,
                            [liftName]: parseNumberInput(e.target.value),
                          }))
                        }
                        className="squad-input pr-12"
                        placeholder="0"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        lb
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="squad-button squad-button-primary"
                >
                  {saving ? "Saving..." : "Save Starting Weights"}
                </button>
              </div>
            </section>

            <section className="squad-page-stack">
              <div>
                <p className="squad-label">Strength</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Latest Lift Weights
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
                  Latest Conditioning Scores
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
                        {card.kind === "time"
                          ? timeDisplay(log)
                          : amrapDisplay(log)}
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        {card.kind === "time"
                          ? timeSubtext(log)
                          : amrapSubtext(log)}
                      </p>

                      {log?.logged_at && (
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {formatDateTime(log.logged_at)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <section className="squad-card p-5 sm:p-6">
                <div className="mb-5">
                  <p className="squad-label">Delete Logs</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight">
                    Strength Logs
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Delete incorrect strength entries for this user.
                  </p>
                </div>

                <div className="space-y-3">
                  {strengthLogs.length === 0 ? (
                    <div className="squad-empty">No strength logs yet.</div>
                  ) : (
                    strengthLogs.slice(0, 10).map((log) => {
                      const buttonId = `strength-${log.id}`;

                      return (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-white/8 bg-white/4 p-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-lg font-bold text-white">
                                {formatStrengthTitle(log.workout_day)}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {formatDateTime(log.logged_at)}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-300">
                                {formatStrengthDetail(log)}
                              </p>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteStrengthLog(log)}
                                disabled={deletingId === buttonId}
                                className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
                              >
                                {deletingId === buttonId
                                  ? "Deleting..."
                                  : "Delete Log"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="squad-card p-5 sm:p-6">
                <div className="mb-5">
                  <p className="squad-label">Delete Logs</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight">
                    Conditioning Logs
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Delete incorrect conditioning entries for this user.
                  </p>
                </div>

                <div className="space-y-3">
                  {conditioningLogs.length === 0 ? (
                    <div className="squad-empty">No conditioning logs yet.</div>
                  ) : (
                    conditioningLogs.slice(0, 10).map((log) => {
                      const buttonId = `conditioning-${log.id}`;

                      return (
                        <div
                          key={log.id}
                          className="rounded-2xl border border-white/8 bg-white/4 p-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-lg font-bold text-white">
                                {CONDITIONING_EVENTS[log.event_name].label}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {formatDateTime(log.logged_at)}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-300">
                                {formatConditioningDetail(log)}
                              </p>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteConditioningLog(log)}
                                disabled={deletingId === buttonId}
                                className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
                              >
                                {deletingId === buttonId
                                  ? "Deleting..."
                                  : "Delete Log"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </section>
          </>
        ) : (
          <section className="squad-card p-6">
            <p className="text-sm text-slate-300">
              Select a user to load their admin dashboard.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}