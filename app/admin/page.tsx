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
      <main className="p-6">
        <div className="mx-auto max-w-5xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl">
        <AppNav />

        <h1 className="mb-6 text-3xl font-bold">Admin</h1>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            >
              <option value="">Choose a user</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.profile_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {LIFTS.map((liftName) => (
              <div key={liftName}>
                <label className="mb-2 block text-sm font-semibold">{liftName}</label>
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Starting Weights"}
          </button>

          {message && <p className="mt-4 text-slate-300">{message}</p>}
        </div>
      </div>
    </main>
  );
}