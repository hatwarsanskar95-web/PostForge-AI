import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

    // 1. Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Get the authenticated user (use cookie-based client for auth only)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error in verify:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Use admin client for all DB writes (bypasses RLS completely)
    const admin = createAdminClient();

    // Get plan details
    const { data: plan, error: planError } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("plan_slug", planId)
      .single();

    if (planError || !plan) {
      console.error("Plan fetch error:", planError);
      throw new Error(`Plan not found: ${planId}`);
    }

    // Calculate dates
    const now = new Date();
    let endDate = new Date();
    if (plan.billing_cycle === "monthly") endDate.setMonth(now.getMonth() + 1);
    else if (plan.billing_cycle === "yearly") endDate.setFullYear(now.getFullYear() + 1);
    else if (plan.billing_cycle === "weekly") endDate.setDate(now.getDate() + 7);
    else endDate.setMonth(now.getMonth() + 1); // default 1 month

    // 4. Upsert subscription
    const { error: upsertError } = await admin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: user.id,
          user_email: user.email,
          current_plan: plan.plan_slug,
          razorpay_order_id,
          razorpay_payment_id,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
          billing_cycle: plan.billing_cycle,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Subscription upsert error:", upsertError);
      throw new Error(`Subscription upsert failed: ${upsertError.message}`);
    }

    // 5. Insert payment history
    const { error: insertError } = await admin.from("payment_history").insert({
      user_id: user.id,
      user_email: user.email,
      plan_slug: plan.plan_slug,
      amount: plan.price,
      razorpay_order_id,
      razorpay_payment_id,
      status: "success",
      created_at: now.toISOString(),
    });

    if (insertError) {
      console.error("Payment history insert error:", insertError);
      throw new Error(`Payment history insert failed: ${insertError.message}`);
    }

    // 6. Reset / update generation usage
    let nextReset = new Date();
    if (plan.billing_cycle === "weekly") nextReset.setDate(now.getDate() + 7);
    else if (plan.billing_cycle === "yearly") nextReset.setMonth(now.getMonth() + 1);
    else nextReset.setMonth(now.getMonth() + 1);

    const { error: usageError } = await admin.from("generation_usage").upsert(
      {
        user_id: user.id,
        user_email: user.email,
        current_plan: plan.plan_slug,
        generation_count: 0,
        generation_limit: plan.generation_limit,
        current_period_start: now.toISOString(),
        current_period_end: nextReset.toISOString(),
        next_reset_date: nextReset.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (usageError) {
      console.error("Generation usage upsert error:", usageError);
      // Non-fatal — subscription already saved, log and continue
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
