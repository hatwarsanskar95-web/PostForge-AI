import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as string | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Build the correct redirect URL for both local and production
  const buildRedirectUrl = (path: string) => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) return `${origin}${path}`
    if (forwardedHost) return `https://${forwardedHost}${path}`
    return `${origin}${path}`
  }

  const supabase = await createClient()

  let sessionUser = null

  // --- Step 1: Establish session via code or token_hash ---
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] code exchange error:', error.message)
    } else {
      sessionUser = data.user
    }
  } else if (token_hash && type) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
    } else {
      sessionUser = data.user
    }
  }

  // --- Step 2: Get the current user ---
  if (!sessionUser) {
    const { data: { user } } = await supabase.auth.getUser()
    sessionUser = user
  }

  // --- Step 3: Password recovery — skip everything and go straight to reset page ---
  if (next === '/update-password') {
    return NextResponse.redirect(buildRedirectUrl('/update-password'))
  }

  if (!sessionUser) {
    // If they came with a code, their email was verified by Supabase backend, 
    // but the auto-login (PKCE) failed (e.g., opened in a different browser).
    // We should STILL show them the Verification Success popup on the login page.
    if (code || next === '/verify-success') {
      return NextResponse.redirect(buildRedirectUrl('/login?mode=signup&verified=true'))
    }
    // Truly not authenticated and not a verification — send to login
    return NextResponse.redirect(buildRedirectUrl('/login?message=Sign+in+failed.+Please+try+again.'))
  }

  // --- Step 4: Ensure the user profile exists in public.users ---
  // (Only attempt for email signups; Google users have their own profile completion flow)
  const isEmailProvider = sessionUser.app_metadata?.provider === 'email'

  if (isEmailProvider) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', sessionUser.id)
      .single()

    if (!profile) {
      // Profile doesn't exist yet — create it from user_metadata
      const meta = sessionUser.user_metadata ?? {}
      if (meta.username && meta.linkedin_url) {
        const { error: upsertError } = await supabase.from('users').upsert({
          id: sessionUser.id,
          email: sessionUser.email,
          full_name: meta.full_name ?? '',
          username: meta.username,
          mobile_number: meta.mobile_number ?? meta.phone ?? '',
          linkedin_url: meta.linkedin_url,
          avatar_id: meta.avatar_id ?? 'boy-1',
          auth_provider: 'email',
          updated_at: new Date().toISOString(),
        })
        if (upsertError) {
          // Log but do NOT block — user is authenticated, let them through
          console.error('[auth/callback] profile upsert error (non-blocking):', upsertError.message)
        }
      }
    }
  }

  // --- Step 5: Google / OAuth user with no profile → complete profile ---
  if (!isEmailProvider) {
    const { data: profile } = await supabase
      .from('users')
      .select('username, linkedin_url')
      .eq('id', sessionUser.id)
      .single()
    const hasCompleteProfile = !!(profile?.username && profile?.linkedin_url)
    if (!hasCompleteProfile) {
      return NextResponse.redirect(buildRedirectUrl('/login?mode=complete'))
    }
  }

  // --- Step 6: Everything is good — redirect to intended destination ---
  // Force /login?verified=true for email signups in case Supabase stripped the ?next parameter
  let finalRedirect = next;
  if (isEmailProvider || type === 'signup' || next === '/verify-success' || code) {
    finalRedirect = '/login?mode=signup&verified=true';
  }

  return NextResponse.redirect(buildRedirectUrl(finalRedirect))
}
