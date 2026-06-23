import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { DownloadInvoiceButton } from "@/components/ui/download-invoice-button";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const admin = createAdminClient();

  // Fetch payment history via admin (bypasses RLS)
  const { data: history } = await admin
    .from("payment_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch user profile for name and phone
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, mobile_number")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <header className="flex items-center px-6 py-5 bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-10">
        <Link href="/dashboard/plans" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Back to Plans
        </Link>
        <div className="flex-1 flex justify-center">
          <span className="font-bold text-xl tracking-tight text-[#d8b4fe]">Payment History</span>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Your Invoices</h1>
          <p className="text-gray-400">View and download your past subscription receipts.</p>
        </div>

        {(!history || history.length === 0) ? (
          <div className="p-12 border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-[#121214]/50">
            <FileText size={48} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No payment history</h3>
            <p className="text-gray-400 max-w-sm">You haven't made any purchases yet. Your invoices will appear here once you subscribe to a plan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((payment) => (
              <div key={payment.id} className="p-6 rounded-2xl bg-[#121214] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                      {payment.plan_slug} Plan
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                        {payment.status}
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span>Billed to: {userName}</span>
                      <span>•</span>
                      <span>{new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t border-white/5 md:border-0">
                  <div className="text-left md:text-right">
                    <div className="text-sm text-gray-400">Amount</div>
                    <div className="font-bold text-xl">₹{payment.amount}</div>
                  </div>
                  
                  <DownloadInvoiceButton 
                    payment={payment} 
                    user={{
                      id: user.id,
                      name: userName,
                      email: user.email || "",
                      phone: profile?.mobile_number || "",
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
