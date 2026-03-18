"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import LogoutButton from "./LogOutButton";

type NavLink = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function AppNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setAdminChecked(true);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (mounted) {
        setIsAdmin(Boolean(data?.is_admin));
        setAdminChecked(true);
      }
    }

    loadAdminStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const links = useMemo<NavLink[]>(() => {
    return [
      { href: "/", label: "Today" },
      { href: "/stats", label: "Stats" },
      { href: "/history", label: "History" },
      { href: "/leaderboard", label: "Leaderboard" },
      ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    ];
  }, [isAdmin]);

  return (
    <>
      <nav className="squad-top-nav hidden md:block">
        <div className="squad-card squad-glow overflow-hidden px-4 py-4 lg:px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="squad-label">Squad PT</p>
              <p className="mt-1 text-sm text-slate-300">Training tracker</p>
            </div>

            <div className="flex justify-end">
              <LogoutButton />
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((link) => {
              const isActive = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white !text-slate-950 border border-white shadow-[0_14px_36px_rgba(255,255,255,0.14)]"
                      : "border border-white/8 bg-white/5 text-slate-100 hover:bg-white/9"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <nav className="md:hidden">
        {pathname === "/" && (
          <div className="fixed right-3 z-50 top-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="rounded-lg border border-white/10 bg-[rgba(7,15,28,0.82)] px-1.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="origin-top-right scale-75">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}

        <div className="squad-mobile-dock">
          <div className="rounded-[28px] border border-white/10 bg-[rgba(7,15,28,0.92)] px-2 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div
              className={`grid gap-1 ${
                isAdmin && adminChecked ? "grid-cols-5" : "grid-cols-4"
              }`}
            >
              {links.map((link) => {
                const isActive = isActivePath(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex min-h-[58px] items-center justify-center rounded-[20px] px-2 text-center text-[11px] font-semibold leading-tight transition ${
                      isActive
                        ? "bg-white !text-slate-950 border border-white shadow-[0_10px_24px_rgba(255,255,255,0.14)]"
                        : "text-slate-300 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}