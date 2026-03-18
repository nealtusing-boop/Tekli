"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1500); // stays visible longer

    const timer2 = setTimeout(() => {
      setVisible(false);
    }, 2000); // total duration

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/icons/icon-512.png"
          alt="Squad PT"
          className="h-20 w-20 rounded-2xl shadow-lg"
        />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Squad PT
        </p>
      </div>
    </div>
  );
}