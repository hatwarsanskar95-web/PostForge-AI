"use client";

import { Settings } from "lucide-react";
import Link from "next/link";

export function SettingsDropdown() {
  return (
    <Link
      href="/dashboard/settings"
      className="p-2 text-white/70 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all flex items-center justify-center focus:outline-none"
      aria-label="Settings"
    >
      <Settings size={18} className="transition-transform duration-300 hover:rotate-90" />
    </Link>
  );
}
