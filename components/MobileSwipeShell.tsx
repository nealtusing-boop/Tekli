"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type MobileSwipeShellProps = {
  currentPath: "/" | "/stats" | "/history" | "/leaderboard" | "/admin";
  children: ReactNode;
};

type RouteItem = {
  href: "/" | "/stats" | "/history" | "/leaderboard" | "/admin";
  label: string;
};

export default function MobileSwipeShell({
  currentPath,
  children,
}: MobileSwipeShellProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const startedOnInteractive = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (mounted) {
        setIsAdmin(Boolean(data?.is_admin));
      }
    }

    loadAdminStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const routes = useMemo<RouteItem[]>(() => {
    const baseRoutes: RouteItem[] = [
      { href: "/", label: "Today" },
      { href: "/stats", label: "Stats" },
      { href: "/history", label: "History" },
      { href: "/leaderboard", label: "Leaderboard" },
    ];

    if (isAdmin) {
      baseRoutes.push({ href: "/admin", label: "Admin" });
    }

    return baseRoutes;
  }, [isAdmin]);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (window.innerWidth >= 768) return;

    const target = event.target as HTMLElement | null;
    startedOnInteractive.current = Boolean(
      target?.closest("button, a, input, select, textarea, label")
    );

    const touch = event.changedTouches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (window.innerWidth >= 768) return;
    if (startedOnInteractive.current) return;
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    const horizontalThreshold = 70;
    const verticalAllowance = 80;

    if (Math.abs(deltaY) > verticalAllowance) return;
    if (Math.abs(deltaX) < horizontalThreshold) return;

    const currentIndex = routes.findIndex((route) => route.href === currentPath);
    if (currentIndex === -1) return;

    if (deltaX < 0) {
      const nextRoute = routes[currentIndex + 1];
      if (nextRoute) {
        router.push(nextRoute.href);
      }
      return;
    }

    const previousRoute = routes[currentIndex - 1];
    if (previousRoute) {
      router.push(previousRoute.href);
    }
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}