"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/");
      }
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              profile_name: profileName,
            },
          },
        });

        if (error) throw error;

        setMessage(
          "Account created. If email confirmation is turned on in Supabase, confirm your email, then log in."
        );
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
      }
    } catch (error: any) {
      setMessage(error?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-cyan-400/6 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="squad-card-strong overflow-hidden p-5 sm:p-7">
          <div className="mb-6">
            <p className="squad-label">Squad PT</p>
            <h1 className="squad-title mt-3 text-4xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              {mode === "login"
                ? "Log in to your squad training account."
                : "Set up your login and profile name to join the app."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/4 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-slate-950 shadow"
                  : "text-slate-300 hover:bg-white/6"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-slate-950 shadow"
                  : "text-slate-300 hover:bg-white/6"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">
                Email
              </label>
              <input
                type="email"
                className="squad-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-100">
                Password
              </label>
              <input
                type="password"
                className="squad-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-100">
                  Profile Name
                </label>
                <input
                  type="text"
                  className="squad-input"
                  placeholder="How your name should appear"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="squad-button squad-button-primary mt-2 w-full py-4 text-base"
            >
              {loading
                ? "Working..."
                : mode === "login"
                ? "Log In"
                : "Create Account"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}