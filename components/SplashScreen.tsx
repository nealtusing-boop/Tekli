"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setAnimateIn(true);
    }, 40);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2400);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a] transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center gap-4">
        <div
          className={`absolute left-1/2 top-[42%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 blur-2xl transition-all duration-1000 ${
            animateIn ? "scale-100 opacity-100" : "scale-75 opacity-60"
          } ${fadeOut ? "opacity-0" : ""}`}
        />

        <div
          className={`relative transition-all duration-700 ease-out ${
            animateIn ? "scale-100 opacity-100" : "scale-90 opacity-0"
          } ${fadeOut ? "scale-105" : ""}`}
        >
          <img
            src="/icons/icon-512.png"
            alt="Squad PT"
            className="h-20 w-20 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
          />
        </div>

        <p
          className={`text-sm font-semibold tracking-[0.18em] text-slate-300 transition-all duration-700 ${
            animateIn ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          Squad PT
        </p>
      </div>
    </div>
  );
}