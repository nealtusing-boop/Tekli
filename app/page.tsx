"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../components/AppNav";
import { supabase } from "../lib/supabase";

type DayPlan = {
  key: string;
  label: string;
  title: string;
  description: string[];
  actions: { label: string; href: string }[];
};

const WEEK_PLANS: DayPlan[] = [
  {
    key: "monday",
    label: "Monday",
    title: "5 Mile Run",
    description: ["5 mile run (off post)"],
    actions: [{ label: "Log Run", href: "/conditioning?event=5_mile_run" }],
  },
  {
    key: "tuesday",
    label: "Tuesday",
    title: "Strength + AMRAP #1",
    description: [
      "Strength",
      "Back Squat 5x5",
      "Bench Press 5x5",
      "Barbell Row 5x5",
      "",
      "15 Minute AMRAP",
      "20 KB Swings",
      "10 DB Thrusters",
      "10 Toes to Bar",
    ],
    actions: [
      { label: "Log Strength", href: "/strength?day=tuesday" },
      { label: "Log AMRAP #1", href: "/conditioning?event=amrap_1" },
    ],
  },
  {
    key: "wednesday",
    label: "Wednesday",
    title: "Modified Murph",
    description: [
      "400m Run",
      "5 rounds of:",
      "5 Pull Ups",
      "10 Push Ups",
      "10 Sit Ups",
      "15 Air Squats",
      "Repeat x4 total",
    ],
    actions: [{ label: "Log Murph", href: "/conditioning?event=murph" }],
  },
  {
    key: "thursday",
    label: "Thursday",
    title: "Strength + AMRAP #2",
    description: [
      "Strength",
      "Front Squat 5x5",
      "Overhead Press 5x5",
      "Deadlift 1x5",
      "",
      "15 Minute AMRAP",
      "20 Alternating DB Snatches",
      "10 Burpee Box Jump Overs",
      "10 Russian Twists w/ plate",
    ],
    actions: [
      { label: "Log Strength", href: "/strength?day=thursday" },
      { label: "Log AMRAP #2", href: "/conditioning?event=amrap_2" },
    ],
  },
  {
    key: "friday",
    label: "Friday",
    title: "40 lb Ruck",
    description: ["40 lb ruck (post lap x2)"],
    actions: [{ label: "Log Ruck", href: "/conditioning?event=ruck" }],
  },
];

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
  result.setDate(monday.getDate() + index);

  return result.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TodayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(getDefaultDayIndex());

  const selectedPlan = useMemo(
    () => WEEK_PLANS[selectedDayIndex],
    [selectedDayIndex]
  );

  const displayedDate = useMemo(
    () => getDisplayedDateForIndex(selectedDayIndex),
    [selectedDayIndex]
  );

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("profile_name")
        .eq("id", user.id)
        .single();

      setProfileName(data?.profile_name || "");
      setLoading(false);
    }

    loadUser();
  }, [router]);

  function goPreviousDay() {
    setSelectedDayIndex((current) => Math.max(0, current - 1));
  }

  function goNextDay() {
    setSelectedDayIndex((current) => Math.min(WEEK_PLANS.length - 1, current + 1));
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-5xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Squad PT
          </p>
          <h1 className="mt-2 text-4xl font-bold">Today</h1>
          <p className="mt-3 text-slate-300">
            Welcome{profileName ? `, ${profileName}` : ""}. View this week’s
            workout plan and log the correct session.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goPreviousDay}
              disabled={selectedDayIndex === 0}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-xl font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Selected Day
              </p>
              <h2 className="mt-1 text-3xl font-bold">{selectedPlan.label}</h2>
              <p className="mt-1 text-sm text-slate-400">{displayedDate}</p>
            </div>

            <button
              type="button"
              onClick={goNextDay}
              disabled={selectedDayIndex === WEEK_PLANS.length - 1}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-xl font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
            >
              →
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Workout
            </p>
            <h3 className="mt-2 text-3xl font-bold">{selectedPlan.title}</h3>

            <div className="mt-5 space-y-2 text-slate-300">
              {selectedPlan.description.map((line, index) =>
                line === "" ? (
                  <div key={index} className="h-3" />
                ) : (
                  <p key={index}>{line}</p>
                )
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {selectedPlan.actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {WEEK_PLANS.map((plan, index) => {
              const isSelected = index === selectedDayIndex;

              return (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedDayIndex(index)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <p className="font-semibold">{plan.label}</p>
                  <p className="mt-1 text-sm opacity-80">{plan.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}