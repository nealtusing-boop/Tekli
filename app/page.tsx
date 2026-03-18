"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../components/AppNav";
import { supabase } from "../lib/supabase";
import {
  WEEK_PLANS,
  getDefaultDayIndex,
  getDisplayedDateForIndex,
} from "../lib/schedule";

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
    setSelectedDayIndex((current) =>
      Math.min(WEEK_PLANS.length - 1, current + 1)
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
                Welcome{profileName ? `, ${profileName}` : ""}. View the week,
                pick the correct training day, and log your session fast.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {selectedPlan.actions.map((action) => (
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

        <section className="squad-card p-4 sm:p-6">
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
              disabled={selectedDayIndex === WEEK_PLANS.length - 1}
              className="squad-button squad-button-secondary h-12 w-12 rounded-2xl p-0 text-xl"
            >
              →
            </button>
          </div>

          <div className="squad-card-strong p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="squad-label">Workout</p>
                <h3 className="squad-title mt-3 text-3xl font-bold tracking-tight">
                  {selectedPlan.title}
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-base leading-7 text-slate-200">
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
                  className="squad-button squad-button-primary"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {WEEK_PLANS.map((plan, index) => {
              const isSelected = index === selectedDayIndex;

              return (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedDayIndex(index)}
                  className={`rounded-[22px] border p-4 text-left transition ${
                    isSelected
                      ? "border-blue-400/50 bg-blue-500/12 text-white shadow-[0_12px_32px_rgba(47,109,246,0.18)]"
                      : "border-white/8 bg-white/4 text-slate-200 hover:bg-white/7"
                  }`}
                >
                  <p className="text-base font-semibold">{plan.label}</p>
                  <p className="mt-2 text-sm leading-5 text-slate-300">
                    {plan.title}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}