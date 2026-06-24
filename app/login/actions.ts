'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  url = url.startsWith('http') ? url : `https://${url}`
  return url.replace(/\/$/, '')
}

export async function login(email: string, password: string): Promise<{ error: string | null, type?: 'check_email' | 'success' }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: null, type: 'check_email' }
    }
    return { error: error.message }
  }
  revalidatePath('/', 'layout')
  return { error: null, type: 'success' }
}

export async function signup(data: {
  email: string
  password: string
  fullName: string
  username: string
  mobileNumber: string
  linkedinUrl: string
  avatarId: string
}): Promise<{ error: string | null, type?: 'check_email' | 'success' }> {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        username: data.username,
        mobile_number: data.mobileNumber,
        linkedin_url: data.linkedinUrl,
        avatar_id: data.avatarId,
      },
      emailRedirectTo: `${getBaseUrl()}/auth/callback?next=/verify-success`,
    },
  })

  if (error) return { error: error.message }

  // The profile insertion is now fully handled by the handle_new_user database trigger
  // using the options.data payload.

  let type: 'check_email' | 'success' = 'success'
  if (authData.user && !authData.session) {
    type = 'check_email'
  }

  revalidatePath('/', 'layout')
  return { error: null, type }
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=/update-password`,
  })
  
  if (error) {
    return { error: error.message }
  }
  return { error: null }
}

export async function completeProfile(data: {
  fullName: string
  username: string
  mobileNumber: string
  linkedinUrl: string
  avatarId: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) return { error: 'Not authenticated' }

  const { error: profileError } = await supabase.from('users').upsert({
    id: userData.user.id,
    email: userData.user.email,
    full_name: data.fullName,
    username: data.username,
    mobile_number: data.mobileNumber,
    linkedin_url: data.linkedinUrl,
    avatar_id: data.avatarId,
    auth_provider: userData.user.app_metadata.provider || 'unknown',
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    console.error('Profile update error:', profileError.message)
    return { error: profileError.message }
  }

  revalidatePath('/', 'layout')
  return { error: null }
}

export async function resendVerificationEmail(email: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback?next=/verify-success`,
    }
  })
  return { error: error?.message || null }
}
