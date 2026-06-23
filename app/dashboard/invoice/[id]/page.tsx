import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrintButton from "./print-button";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch specific payment using admin client (bypasses RLS)
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payment_history")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <p>Invoice not found or unauthorized.</p>
      </div>
    );
  }

  // Fetch user profile
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
  const email = user.email || "";
  const phone = profile?.phone || user.user_metadata?.phone || "";

  const invoiceNumber = `INV-${payment.razorpay_order_id.substring(payment.razorpay_order_id.length - 8).toUpperCase()}`;
  const date = new Date(payment.created_at);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900 selection:bg-purple-200">
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-sm border border-gray-200 rounded-lg">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter text-purple-600 mb-1">PostForge AI</h1>
            <p className="text-sm text-gray-500">The Ultimate LinkedIn Creator Tool</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-300 uppercase tracking-widest">Invoice</h2>
            <p className="text-sm font-medium text-gray-900 mt-2">{invoiceNumber}</p>
            <p className="text-sm text-gray-500">{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex justify-between mb-12 pb-8 border-b border-gray-100">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
            <div className="font-semibold text-gray-900">{name}</div>
            <div className="text-sm text-gray-600 mt-1">{email}</div>
            {phone && <div className="text-sm text-gray-600">{phone}</div>}
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From</h3>
            <div className="font-semibold text-gray-900">PostForge AI Inc.</div>
            <div className="text-sm text-gray-600 mt-1">support@postforge.ai</div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-12">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-5">
                  <div className="font-semibold text-gray-900 capitalize">{payment.plan_slug} Plan Subscription</div>
                  <div className="text-sm text-gray-500 mt-1">Order ID: {payment.razorpay_order_id}</div>
                  <div className="text-sm text-gray-500">Payment ID: {payment.razorpay_payment_id}</div>
                </td>
                <td className="py-5 text-right font-semibold text-gray-900">
                  ₹{payment.amount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-16">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm font-medium">₹{payment.amount}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Tax (0%)</span>
              <span className="text-sm font-medium">₹0</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-bold text-gray-900">Total Paid</span>
              <span className="font-bold text-xl text-purple-600">₹{payment.amount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p className="font-medium text-gray-900 mb-1">Thank you for choosing PostForge AI!</p>
          <p>If you have any questions about this invoice, please contact support@postforge.ai</p>
        </div>

        {/* Print Button */}
        <PrintButton />

      </div>
    </div>
  );
}
