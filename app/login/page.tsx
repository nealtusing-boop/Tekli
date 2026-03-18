"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleAuth() {
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage("Account created. You can now log in.");
        setIsLogin(true);
      }
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  return (
    <main className="squad-shell flex min-h-screen items-center justify-center">
      <div className="squad-card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-4">
          {isLogin ? "Login" : "Create Account"}
        </h1>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="squad-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="squad-input"
          />

          <button onClick={handleAuth} className="squad-button">
            {isLogin ? "Login" : "Sign Up"}
          </button>

          {message && (
            <p className="text-sm text-center text-red-400">{message}</p>
          )}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-400 underline mt-2"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </main>
  );
}