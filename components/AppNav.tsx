"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import LogoutButton from "./LogOutButton";

export default function AppNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadAdminStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      setIsAdmin(Boolean(data?.is_admin));
    }

    loadAdminStatus();
  }, []);

  const links = [
    { href: "/", label: "Today" },
    { href: "/stats", label: "Stats" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/history", label: "History" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-lg md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-slate-950 shadow"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <LogoutButton />
    </div>
  );
}