"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AutoRefresh() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let lastRefresh = 0;

    const safeRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh < 1500) return;
      lastRefresh = now;
      router.refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        safeRefresh();
      }
    };

    const handleFocus = () => {
      safeRefresh();
    };

    const handlePageshow = () => {
      safeRefresh();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageshow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageshow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, pathname]);

  return null;
}