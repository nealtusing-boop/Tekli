import { Suspense } from "react";
import StrengthClient from "./StrengthClient";

export default function StrengthPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <div className="mx-auto max-w-6xl">Loading...</div>
        </main>
      }
    >
      <StrengthClient />
    </Suspense>
  );
}