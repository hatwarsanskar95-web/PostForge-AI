import { createClient } from "@/lib/supabase/client";

/**
 * Calculates the word count of a given string.
 */
export function getWordCount(content: string): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).length;
}

/**
 * Generates a title up to 60 characters based on the content.
 */
export function generateTitle(content: string, type: string): string {
  if (!content) return `Generated from ${type.replace(/_/g, ' ')}`;
  
  // Try to find the first line or sentence
  let snippet = content.split('\n')[0].trim();
  
  // Remove emojis at the start
  snippet = snippet.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '');

  if (snippet.length > 55) {
    snippet = snippet.substring(0, 55).trim() + "...";
  }

  if (snippet.length < 5) {
     return `Generated from ${type.replace(/_/g, ' ')}`;
  }
  
  return snippet;
}

/**
 * Fetches the current user's profile info (email + full name) for audit columns.
 */
async function getUserInfo(supabase: ReturnType<typeof createClient>): Promise<{ email: string | null; fullName: string | null }> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { email: null, fullName: null };
  const user = data.user;

  const email = user.email ?? null;
  // Try to get full_name from the users table first, fall back to user_metadata
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user.user_metadata?.full_name || null;
  return { email, fullName };
}

/**
 * Automatically saves a successful generation to the history table.
 */
export async function saveToHistory(type: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;

  const title = generateTitle(content, type);
  const wordCount = getWordCount(content);
  const { email, fullName } = await getUserInfo(supabase);

  const { data: insertData, error: insertError } = await supabase.from("generation_history").insert({
    user_id: user.id,
    user_email: email,
    user_full_name: fullName,
    generator_type: type,
    title,
    content,
    word_count: wordCount
  }).select().single();

  if (insertError) {
    console.error("Failed to save history:", insertError);
  }
  return insertData;
}

/**
 * Manually saves a post to the saved_posts table.
 */
export async function savePost(type: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "User not authenticated" };
  const user = data.user;

  const title = generateTitle(content, type);
  const wordCount = getWordCount(content);
  const { email, fullName } = await getUserInfo(supabase);

  const { data: insertData, error: insertError } = await supabase.from("saved_posts").insert({
    user_id: user.id,
    user_email: email,
    user_full_name: fullName,
    generator_type: type,
    title,
    content,
    word_count: wordCount
  }).select().single();

  if (insertError) {
    console.error("Failed to save post:", insertError);
    return { error: insertError };
  }
  return { data: insertData };
}

/**
 * Soft-deletes a record from generation_history (marks deleted_by_user = true).
 * The row stays in Supabase for admin review.
 */
export async function softDeleteHistory(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("generation_history")
    .update({ deleted_by_user: true })
    .eq("id", id);
  return { error };
}

/**
 * Soft-deletes a record from saved_posts (marks deleted_by_user = true).
 */
export async function softDeleteSavedPost(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("saved_posts")
    .update({ deleted_by_user: true })
    .eq("id", id);
  return { error };
}

/**
 * Soft-deletes all records from generation_history for the current user.
 */
export async function softDeleteAllHistory() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };

  const { error } = await supabase
    .from("generation_history")
    .update({ deleted_by_user: true })
    .eq("user_id", user.id)
    .eq("deleted_by_user", false);
  return { error };
}

/**
 * Soft-deletes all records from saved_posts for the current user.
 */
export async function softDeleteAllSavedPosts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };

  const { error } = await supabase
    .from("saved_posts")
    .update({ deleted_by_user: true })
    .eq("user_id", user.id)
    .eq("deleted_by_user", false);
  return { error };
}
