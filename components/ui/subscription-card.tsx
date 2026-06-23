"use client";

import { useUsage } from "@/contexts/usage-context";

export function SubscriptionCard() {
  const { stats, loading } = useUsage();

  if (loading || !stats?.usage || !stats?.plan) {
    // Skeleton matching the same layout
    return (
      <div className="border border-white/10 px-5 py-4 rounded-2xl flex flex-col gap-3 backdrop-blur-md shadow-lg sm:min-w-[260px] bg-[#111]/80 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-white/10 rounded-full"></div>
          <div className="h-4 w-16 bg-white/10 rounded-full"></div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="h-3 w-20 bg-white/10 rounded-full"></div>
          <div className="h-3 w-10 bg-white/10 rounded-full"></div>
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-3 w-16 bg-white/10 rounded-full"></div>
          <div className="h-3 w-20 bg-white/10 rounded-full"></div>
        </div>
      </div>
    );
  }

  const usage = stats.usage;
  const plan = stats.plan;
  const sub = stats.sub;
  const isPaid = plan.plan_slug && plan.plan_slug !== 'free';
  const planName = plan.plan_name || 'Free';
  const isYearly = plan.billing_cycle === 'yearly';
  const isFree = plan.plan_slug === 'free';
  const remaining = stats.remaining ?? 0;
  const limit = plan.generation_limit ?? 3;
  const resetDate = usage.next_reset_date
    ? new Date(usage.next_reset_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const expiryDate = sub?.end_date
    ? new Date(sub.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className={`border px-5 py-4 rounded-2xl flex flex-col gap-3 backdrop-blur-md shadow-lg sm:min-w-[260px]
      ${isPaid ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-[#111]/80 border-white/10'}`}>

      {/* Plan badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest ${isPaid ? 'text-indigo-300' : 'text-gray-400'}`}>
          {isPaid ? '⭐' : '🆓'} {planName}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider border border-emerald-500/30">
          {sub?.status || 'Active'}
        </span>
      </div>

      {/* Credits Remaining */}
      <div className="flex justify-between items-center text-xs mt-1">
        <span className="text-gray-400">Credits Remaining</span>
        <span className="text-white font-bold tracking-widest">
          {remaining} / {limit}
        </span>
      </div>

      {/* Conditional Dates: Free Plan & Annual Plan show Next Reset */}
      {(isFree || isYearly) && (
        <div className="flex justify-between items-center text-xs pt-1">
          <span className="text-gray-400">{isFree ? 'Next Reset' : 'Next Credit Reset'}</span>
          <span className="text-gray-300 font-medium">{resetDate}</span>
        </div>
      )}

      {/* Conditional Dates: Annual Plan ONLY shows Expiry */}
      {isYearly && (
        <div className="flex justify-between items-center text-xs pt-1">
          <span className="text-gray-400">Plan Expiry</span>
          <span className="text-gray-300 font-medium">{expiryDate}</span>
        </div>
      )}

    </div>
  );
}
