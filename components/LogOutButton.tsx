"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="squad-button squad-button-danger min-w-[108px]"
    >
      Logout
    </button>
  );
}