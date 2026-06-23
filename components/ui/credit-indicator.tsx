"use client";

import { useUsage } from "@/contexts/usage-context";
import { Zap } from "lucide-react";
import Link from "next/link";

export function CreditIndicator() {
  const { stats, loading } = useUsage();

  if (loading || !stats?.plan) return (
    <div className="animate-pulse bg-white/5 h-8 w-48 rounded-lg border border-white/5"></div>
  );

  const planName = stats.plan?.plan_name || "Free Plan";
  const totalCredits = stats.plan?.generation_limit ?? 3;
  const resetDate = stats.usage?.next_reset_date 
    ? new Date(stats.usage.next_reset_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : "";
  const isPaid = stats.plan?.plan_slug && stats.plan.plan_slug !== 'free';
  const isFree = stats.plan?.plan_slug === 'free';
  const isYearly = stats.plan?.billing_cycle === 'yearly';
  const showReset = isFree || isYearly;
  
  return (
    <Link href="/dashboard/plans" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121214] hover:bg-[#1a1a1c] border border-white/10 transition-colors cursor-pointer shadow-sm group">
      <div className="flex items-center gap-2">
        <Zap size={14} className={isPaid ? "text-indigo-400 group-hover:scale-110 transition-transform" : "text-[#a855f7] group-hover:scale-110 transition-transform"} fill="currentColor" />
        <span className="text-[12px] font-medium text-gray-300 flex items-center gap-1.5">
          <span className="hidden md:inline">{planName} <span className="text-gray-500 mx-0.5">•</span></span>
          <span className="text-white font-bold">{totalCredits}</span> credits
          {showReset && (
            <>
              <span className="hidden sm:inline text-gray-500 mx-0.5">•</span>
              <span className="hidden sm:inline text-gray-400">Resets {resetDate}</span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
