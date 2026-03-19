"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const MAX_PULL = 90;
const TRIGGER_PULL = 72;

export default function PullToRefresh() {
  const router = useRouter();
  const pathname = usePathname();

  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const canStartPull = () => {
      return window.scrollY <= 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (!canStartPull()) return;

      startYRef.current = e.touches[0]?.clientY ?? null;
      pullingRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;
      if (startYRef.current === null) return;
      if (refreshingRef.current) return;

      const currentY = e.touches[0]?.clientY ?? 0;
      const rawDistance = currentY - startYRef.current;

      if (rawDistance <= 0) {
        setPullDistance(0);
        return;
      }

      if (window.scrollY > 0) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }

      const dampened = Math.min(MAX_PULL, rawDistance * 0.5);
      setPullDistance(dampened);
    };

    const finishPull = () => {
      const shouldRefresh = pullDistance >= TRIGGER_PULL;

      pullingRef.current = false;
      startYRef.current = null;

      if (shouldRefresh && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        setPullDistance(56);

        router.refresh();

        window.setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          refreshingRef.current = false;
        }, 900);
      } else {
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      finishPull();
    };

    const onTouchCancel = () => {
      finishPull();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchCancel);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [router, pathname, pullDistance]);

  const visible = pullDistance > 0 || isRefreshing;
  const ready = pullDistance >= TRIGGER_PULL;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${visible ? pullDistance : 0}px)`,
        transition: isRefreshing || !visible ? "transform 180ms ease" : "none",
      }}
    >
      <div
        style={{
          marginTop: 10,
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(5, 12, 24, 0.9)",
          color: "white",
          fontSize: 13,
          fontWeight: 700,
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
          opacity: visible ? 1 : 0,
          transition: "opacity 160ms ease",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {isRefreshing
          ? "Refreshing..."
          : ready
            ? "Release to refresh"
            : "Pull to refresh"}
      </div>
    </div>
  );
}