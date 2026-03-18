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
    <nav className="squad-card sticky top-4 z-40 overflow-hidden px-3 py-3 md:px-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3 px-1 md:mb-0 md:hidden">
            <div>
              <p className="squad-label">Squad PT</p>
              <p className="mt-1 text-sm text-slate-300">Training tracker</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
                      : "border border-white/8 bg-white/5 text-white hover:bg-white/9"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}