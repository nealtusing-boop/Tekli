"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "../../components/AppNav";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  profile_name: string;
};

const LIFTS = [
  "Back Squat",
  "Bench Press",
  "Barbell Row",
  "Front Squat",
  "Overhead Press",
  "Deadlift",
];

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({
    "Back Squat": 0,
    "Bench Press": 0,
    "Barbell Row": 0,
    "Front Squat": 0,
    "Overhead Press": 0,
    Deadlift: 0,
  });

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
    async function loadUserWeights() {
      if (!selectedUserId) return;

      const { data } = await supabase
        .from("lift_settings")
        .select("lift_name, current_weight")
        .eq("user_id", selectedUserId);

      const nextWeights: Record<string, number> = {
        "Back Squat": 0,
        "Bench Press": 0,
        "Barbell Row": 0,
        "Front Squat": 0,
        "Overhead Press": 0,
        Deadlift: 0,
      };

      (data || []).forEach((row: any) => {
        nextWeights[row.lift_name] = row.current_weight || 0;
      });

      setWeights(nextWeights);
    }

    loadUserWeights();
  }, [selectedUserId]);

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

      setMessage("Starting weights saved.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to save starting weights.");
    } finally {
      setSaving(false);
    }
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
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Set or update starting lift weights for any user in the squad.
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
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

            {message && (
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {message}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}