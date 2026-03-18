import { Suspense } from "react";
import ConditioningClient from "./ConditioningClient";

export default function ConditioningPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <div className="mx-auto max-w-4xl">Loading...</div>
        </main>
      }
    >
      <ConditioningClient />
    </Suspense>
  );
}