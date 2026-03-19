"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../components/AppNav";
import { supabase } from "../lib/supabase";
import { getWeekStartDate } from "../lib/date";
import {
  TRAINING_WEEK,
  buildTrainingDayActions,
  buildTrainingDayDescription,
  type ConditioningEventKey,
  type TrainingDayDefinition,
} from "../lib/workouts";

type StrengthLog = {
  id: string;
  workout_day: string;
  week_start_date: string;
};

type ConditioningLog = {
  id: string;
  event_name: ConditioningEventKey;
  week_start_date: string;
};

type TrainingDayStatus = {
  complete: boolean;
  progressText: string;
  badgeText: string;
};

function getDefaultDayIndex() {
  const jsDay = new Date().getDay();

  if (jsDay === 1) return 0;
  if (jsDay === 2) return 1;
  if (jsDay === 3) return 2;
  if (jsDay === 4) return 3;
  if (jsDay === 5) return 4;

  return 0;
}

function getDisplayedDateForIndex(index: number) {
  const today = new Date();
  const jsDay = today.getDay();

  const monday = new Date(today);
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  monday.setDate(today.getDate() + diffToMonday);

  const result = new Date(monday);
  result.setHours(0, 0, 0, 0);
  result.setDate(monday.getDate() + index);

  return result.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDayStatus(
  day: TrainingDayDefinition,
  strengthLogs: StrengthLog[],
  conditioningLogs: ConditioningLog[]
): TrainingDayStatus {
  const hasStrength = (workoutDay: string) =>
    strengthLogs.some((log) => log.workout_day === workoutDay);

  const hasConditioning = (eventName: ConditioningEventKey) =>
    conditioningLogs.some((log) => log.event_name === eventName);

  if (day.key === "monday") {
    const complete = hasConditioning("5_mile_run");
    return {
      complete,
      progressText: complete ? "5 Mile Run logged" : "Run still needs to be logged",
      badgeText: complete ? "Complete" : "Not Started",
    };
  }

  if (day.key === "tuesday") {
    const strengthDone = hasStrength("tuesday");
    const amrapDone = hasConditioning("amrap_1");
    const complete = strengthDone && amrapDone;

    return {
      complete,
      progressText: `${strengthDone ? 1 : 0}/1 strength • ${amrapDone ? 1 : 0}/1 AMRAP`,
      badgeText: complete
        ? "Complete"
        : strengthDone || amrapDone
          ? "In Progress"
          : "Not Started",
    };
  }

  if (day.key === "wednesday") {
    const complete = hasConditioning("murph");
    return {
      complete,
      progressText: complete ? "Murph logged" : "Murph still needs to be logged",
      badgeText: complete ? "Complete" : "Not Started",
    };
  }

  if (day.key === "thursday") {
    const strengthDone = hasStrength("thursday");
    const amrapDone = hasConditioning("amrap_2");
    const complete = strengthDone && amrapDone;

    return {
      complete,
      progressText: `${strengthDone ? 1 : 0}/1 strength • ${amrapDone ? 1 : 0}/1 AMRAP`,
      badgeText: complete
        ? "Complete"
        : strengthDone || amrapDone
          ? "In Progress"
          : "Not Started",
    };
  }

  const complete = hasConditioning("ruck");
  return {
    complete,
    progressText: complete ? "Ruck logged" : "Ruck still needs to be logged",
    badgeText: complete ? "Complete" : "Not Started",
  };
}

export default function TodayPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(getDefaultDayIndex());
  const [strengthLogs, setStrengthLogs] = useState<StrengthLog[]>([]);
  const [conditioningLogs, setConditioningLogs] = useState<ConditioningLog[]>([]);

  const weekStartDate = useMemo(() => getWeekStartDate(), []);

  const selectedPlan = useMemo(
    () => TRAINING_WEEK[selectedDayIndex],
    [selectedDayIndex]
  );

  const displayedDate = useMemo(
    () => getDisplayedDateForIndex(selectedDayIndex),
    [selectedDayIndex]
  );

  const selectedDescription = useMemo(
    () => buildTrainingDayDescription(selectedPlan),
    [selectedPlan]
  );

  const selectedActions = useMemo(
    () => buildTrainingDayActions(selectedPlan),
    [selectedPlan]
  );

  const selectedStatus = useMemo(
    () => getDayStatus(selectedPlan, strengthLogs, conditioningLogs),
    [selectedPlan, strengthLogs, conditioningLogs]
  );

  const completedDaysCount = useMemo(() => {
    return TRAINING_WEEK.filter(
      (day) => getDayStatus(day, strengthLogs, conditioningLogs).complete
    ).length;
  }, [strengthLogs, conditioningLogs]);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: profile }, { data: strengthData }, { data: conditioningData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("profile_name")
            .eq("id", user.id)
            .single(),
          supabase
            .from("strength_logs")
            .select("id, workout_day, week_start_date")
            .eq("user_id", user.id)
            .eq("week_start_date", weekStartDate),
          supabase
            .from("conditioning_logs")
            .select("id, event_name, week_start_date")
            .eq("user_id", user.id)
            .eq("week_start_date", weekStartDate),
        ]);

      setProfileName(profile?.profile_name || "");
      setStrengthLogs(strengthData || []);
      setConditioningLogs((conditioningData || []) as ConditioningLog[]);
      setLoading(false);
    }

    loadPage();
  }, [router, weekStartDate]);

  function goPreviousDay() {
    setSelectedDayIndex((current) => Math.max(0, current - 1));
  }

  function goNextDay() {
    setSelectedDayIndex((current) =>
      Math.min(TRAINING_WEEK.length - 1, current + 1)
    );
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
              <p className="squad-label">Squad PT</p>
              <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Today
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Welcome{profileName ? `, ${profileName}` : ""}. This page now
                pulls directly from the centralized workout definitions, so the
                week, actions, and workout details all stay in sync.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {selectedActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="squad-button squad-button-primary"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="squad-card p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPreviousDay}
                disabled={selectedDayIndex === 0}
                className="squad-button squad-button-secondary h-12 w-12 rounded-2xl p-0 text-xl"
              >
                ←
              </button>

              <div className="text-center">
                <p className="squad-label">Selected Day</p>
                <h2 className="squad-title mt-2 text-3xl font-bold sm:text-4xl">
                  {selectedPlan.label}
                </h2>
                <p className="mt-2 text-sm text-slate-400">{displayedDate}</p>
              </div>

              <button
                type="button"
                onClick={goNextDay}
                disabled={selectedDayIndex === TRAINING_WEEK.length - 1}
                className="squad-button squad-button-secondary h-12 w-12 rounded-2xl p-0 text-xl"
              >
                →
              </button>
            </div>

            <div className="squad-card-strong p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="squad-label">Workout</p>
                  <h3 className="squad-title mt-3 text-3xl font-bold tracking-tight">
                    {selectedPlan.title}
                  </h3>
                </div>

                <div
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                    selectedStatus.complete
                      ? "bg-emerald-500/15 text-emerald-300"
                      : selectedStatus.badgeText === "In Progress"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-white/8 text-slate-300"
                  }`}
                >
                  {selectedStatus.badgeText}
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Progress
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {selectedStatus.progressText}
                </p>
              </div>

              <div className="space-y-2 text-base leading-7 text-slate-200">
                {selectedDescription.map((line, index) =>
                  line === "" ? (
                    <div key={index} className="h-3" />
                  ) : (
                    <p key={index}>{line}</p>
                  )
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="squad-button squad-button-primary"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="squad-card p-5 sm:p-6">
            <p className="squad-label">This Week</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold tracking-tight sm:text-6xl">
                  {completedDaysCount}
                </p>
                <p className="mt-2 text-base text-slate-300">
                  of 5 training days complete
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Week Start
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {new Date(`${weekStartDate}T00:00:00`).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {TRAINING_WEEK.map((day, index) => {
                const status = getDayStatus(day, strengthLogs, conditioningLogs);
                const isSelected = index === selectedDayIndex;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayIndex(index)}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-400/50 bg-blue-500/12 text-white shadow-[0_12px_32px_rgba(47,109,246,0.18)]"
                        : "border-white/8 bg-white/4 text-slate-200 hover:bg-white/7"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">{day.label}</p>
                        <p className="mt-2 text-sm leading-5 text-slate-300">
                          {day.title}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {status.progressText}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          status.complete
                            ? "bg-emerald-500/15 text-emerald-300"
                            : status.badgeText === "In Progress"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-white/8 text-slate-300"
                        }`}
                      >
                        {status.badgeText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}