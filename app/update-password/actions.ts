'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Update the password — Supabase invalidates all other sessions automatically
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  // Sign out of all other sessions so the old password cannot be used
  // The current session (which has the reset token) is also cleared after redirect
  await supabase.auth.signOut({ scope: 'others' })

  revalidatePath('/', 'layout')
  return { error: null }
}
