import { createClient } from "@/lib/supabase/server";

export async function getOrCreateUsage(userId: string, userEmail?: string) {
  const supabase = await createClient();

  // 1. Get subscription with plan details
  let { data: sub } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", userId)
    .single();

  if (!sub) {
    const { data: newSub } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        current_plan: "free",
        status: "active",
      })
      .select("*, subscription_plans(*)")
      .single();
    sub = newSub;
  }

  const plan = sub?.subscription_plans || {
    plan_slug: "free",
    plan_name: "Free Plan",
    generation_limit: 3,
    billing_cycle: "weekly",
  };

  // 2. Get or create generation_usage
  let { data: usage } = await supabase
    .from("generation_usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  const now = new Date();

  // Reset if past reset date or no record exists
  if (!usage || new Date(usage.next_reset_date) <= now) {
    let nextReset = new Date();
    if (plan.billing_cycle === "weekly") nextReset.setDate(now.getDate() + 7);
    else nextReset.setMonth(now.getMonth() + 1); // monthly & yearly reset monthly

    const newUsageData = {
      user_id: userId,
      user_email: userEmail || sub?.user_email,
      current_plan: plan.plan_slug,
      generation_count: 0,
      generation_limit: plan.generation_limit,
      current_period_start: now.toISOString(),
      current_period_end: nextReset.toISOString(),
      next_reset_date: nextReset.toISOString(),
      updated_at: now.toISOString(),
    };

    if (!usage) {
      const { data: newUsage } = await supabase
        .from("generation_usage")
        .insert(newUsageData)
        .select("*")
        .single();
      usage = newUsage;
    } else {
      const { data: updatedUsage } = await supabase
        .from("generation_usage")
        .update(newUsageData)
        .eq("user_id", userId)
        .select("*")
        .single();
      usage = updatedUsage;
    }
  }

  // Sync limit or plan if they changed but don't change count
  if (usage && (usage.generation_limit !== plan.generation_limit || usage.current_plan !== plan.plan_slug)) {
    const { data: updatedUsage } = await supabase
      .from("generation_usage")
      .update({ 
        generation_limit: plan.generation_limit,
        current_plan: plan.plan_slug,
        updated_at: now.toISOString() 
      })
      .eq("user_id", userId)
      .select("*")
      .single();
    usage = updatedUsage;
  }

  // Compute remaining from count
  const remaining = Math.max(0, (usage?.generation_limit ?? 0) - (usage?.generation_count ?? 0));

  return { usage, plan, sub, remaining };
}

export async function checkUsageLimit(userId: string, userEmail?: string) {
  try {
    const { usage, plan, remaining } = await getOrCreateUsage(userId, userEmail);
    if (remaining <= 0) {
      return { ok: false, error: "LIMIT_REACHED", usage, plan };
    }
    return { ok: true, usage, plan, remaining };
  } catch (error: any) {
    console.error("Error checking limit:", error);
    return { ok: false, error: error.message };
  }
}

export async function incrementUsage(userId: string, userEmail?: string, amount: number = 1) {
  try {
    const supabase = await createClient();
    const { usage, remaining } = await getOrCreateUsage(userId, userEmail);

    if (remaining >= amount && usage) {
      await supabase
        .from("generation_usage")
        .update({
          generation_count: (usage.generation_count ?? 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    return true;
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return false;
  }
}
