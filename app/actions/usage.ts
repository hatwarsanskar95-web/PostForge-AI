"use server";

import { checkUsageLimit, incrementUsage, getOrCreateUsage } from "@/lib/usage-utils";
import { createClient } from "@/lib/supabase/server";

export async function checkGenerationAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  
  return await checkUsageLimit(user.id, user.email);
}

export async function consumeGenerationCredit(amount: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  
  const success = await incrementUsage(user.id, user.email, amount);
  return { ok: success };
}

export async function getUserUsageStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  try {
    const data = await getOrCreateUsage(user.id, user.email);
    return data;
  } catch (err) {
    console.error("getUserUsageStats error:", err);
    return null;
  }
}
