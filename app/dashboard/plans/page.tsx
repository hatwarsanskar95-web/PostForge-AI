import PricingSection4 from "@/components/ui/pricing-section-4";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreditIndicator } from "@/components/ui/credit-indicator";

export const metadata = {
  title: "Subscription Plans | PostForge AI",
  description: "View and upgrade your subscription plan.",
};

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let prefill = { name: "", email: "", contact: "" };
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    prefill = {
      name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      email: user.email || '',
      contact: profile?.phone || user.user_metadata?.phone || ''
    };
  }

  return (
    <div className="w-full bg-[#0d1117] min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 bg-[#0d1117] relative">
        <div className="flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 text-[11px] font-medium tracking-widest uppercase text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft size={14} className="text-gray-500" />
            <span className="flex flex-col leading-tight text-left">
              <span>Back to</span>
              <span>Dashboard</span>
            </span>
          </Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <span className="font-bold text-xl tracking-tight text-[#d8b4fe]">PostForge AI</span>
        </div>
        <div className="flex-1 flex justify-end items-center gap-4">
          <Link href="/dashboard/plans/history" className="text-[11px] font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
            Payment History
          </Link>
          <CreditIndicator />
        </div>
      </header>
      <PricingSection4 prefill={prefill} />
    </div>
  );
}
