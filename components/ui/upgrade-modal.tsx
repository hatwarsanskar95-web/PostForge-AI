"use client";

import { Sparkles, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export function UpgradeModal({ usageData, onClose }: { usageData: any; onClose: () => void }) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/plans"); 
  };

  const { usage, plan } = usageData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#10162a] border border-[#1e2a4a] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden shadow-indigo-500/10">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full mx-auto flex items-center justify-center border border-indigo-500/20 mb-2">
            <Sparkles className="text-indigo-400 w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-white">Generation Limit Reached</h2>
          <p className="text-sm text-[#8a9ac8]">
            You have reached your generation limit for your current plan. Upgrade your plan to continue generating AI-powered LinkedIn content.
          </p>

          {usage && (
            <div className="bg-[#0d1117] border border-[#1e2a4a] rounded-xl p-4 text-left space-y-3 mt-6">
              <div className="flex justify-between items-center border-b border-[#1e2a4a] pb-3">
                <span className="text-[#8a9ac8] text-sm">Current Plan</span>
                <span className="text-white font-bold capitalize">{plan?.plan_name || 'Free'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#1e2a4a] pb-3">
                <span className="text-[#8a9ac8] text-sm">Usage</span>
                <span className="text-white font-bold">{usage?.generation_count} / {usage?.generation_limit}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#1e2a4a] pb-3">
                <span className="text-[#8a9ac8] text-sm">Remaining</span>
                <span className="text-white font-bold text-red-400">{Math.max(0, (usage?.generation_limit || 0) - (usage?.generation_count || 0))}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#8a9ac8] text-sm flex items-center gap-1.5"><Calendar size={14}/> Credits Reset On</span>
                <span className="text-white font-bold text-xs text-right">
                  {new Date(usage?.next_reset_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}<br/>
                  {new Date(usage?.next_reset_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              Upgrade Now
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-transparent border border-[#1e2a4a] hover:bg-[#1e2a4a]/50 text-white font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
