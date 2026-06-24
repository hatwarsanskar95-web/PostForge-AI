import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ROOT CAUSE FIX (session persistence):
// Previously, this route used createClient() which writes cookies via
// `cookieStore.set()` from `next/headers`, then returned a separate
// NextResponse.redirect(). In Next.js 16 (Turbopack), cookies set via
// `next/headers` are NOT guaranteed to be included in an explicitly
// constructed NextResponse — causing auth cookies to never reach the browser,
// and getUser() to always return null on the next request.
//
// The fix: use NextRequest (not Request) to read cookies, build the redirect
// response FIRST, then write cookies directly onto that response object.
// This guarantees the Set-Cookie headers are on the exact response the
// browser receives.

export async function GET(request: NextRequest) {

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as string | null
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[auth/callback] OAuth callback reached')
  console.log('[auth/callback] code:', !!code, '| token_hash:', !!token_hash, '| type:', type, '| next:', next)

  // Build the correct redirect URL for both local and production
  const buildRedirectUrl = (path: string) => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) return `${origin}${path}`
    if (forwardedHost) return `https://${forwardedHost}${path}`
    return `${origin}${path}`
  }

  // Helper: create a response with cookies written directly on it.
  // This is the ONLY safe pattern in Next.js 16 — cookies() from next/headers
  // does not reliably propagate to explicit NextResponse objects.
  const createSupabaseWithResponse = (response: NextResponse) => {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Write onto request (for in-flight reads) AND onto the response
            // (so the browser receives Set-Cookie headers)
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  }

  // --- Step 1: Handle password recovery first (before exchanging any code) ---
  if (next === '/update-password' || type === 'recovery') {
    const recoveryResponse = NextResponse.redirect(buildRedirectUrl('/update-password'))
    if (code) {
      const supabase = createSupabaseWithResponse(recoveryResponse)
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[auth/callback] recovery code exchange error:', error.message)
      }
    }
    console.log('[auth/callback] Password recovery detected — redirecting to /update-password')
    return recoveryResponse
  }

  // --- Step 2: Establish session via code or token_hash ---
  let sessionUser = null

  if (code) {
    // Build a temporary response to collect the cookies from exchangeCodeForSession
    const tempResponse = NextResponse.next()
    const supabase = createSupabaseWithResponse(tempResponse)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] code exchange error:', error.message)
    } else {
      sessionUser = data.user
      console.log('[auth/callback] Session established. User:', sessionUser?.email, '| Provider:', sessionUser?.app_metadata?.provider)

      // Build the final redirect with the exact cookies from the session exchange
      const isEmailProvider = sessionUser?.app_metadata?.provider === 'email'
      let destination: string

      if (!isEmailProvider) {
        // Google/OAuth → always /dashboard, no verification needed
        destination = '/dashboard'
        console.log('[auth/callback] Google/OAuth user — redirecting to /dashboard')
      } else if (type === 'signup' || next === '/verify-success') {
        // Email signup verification → show verified popup
        destination = '/login?verified=true'
        console.log('[auth/callback] Email verification — redirecting to /login?verified=true')
      } else {
        destination = next
        console.log('[auth/callback] Email user — redirecting to:', destination)
      }

      const finalResponse = NextResponse.redirect(buildRedirectUrl(destination))
      // Copy all auth cookies from tempResponse onto the final redirect
      tempResponse.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
          maxAge: cookie.maxAge,
          path: cookie.path,
        })
      })
      return finalResponse
    }
  } else if (token_hash && type) {
    const tempResponse = NextResponse.next()
    const supabase = createSupabaseWithResponse(tempResponse)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
    } else {
      sessionUser = data.user
      console.log('[auth/callback] Session established via OTP. User:', sessionUser?.email)

      const destination = (type === 'signup' || next === '/verify-success')
        ? '/login?verified=true'
        : next

      const finalResponse = NextResponse.redirect(buildRedirectUrl(destination))
      tempResponse.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
          maxAge: cookie.maxAge,
          path: cookie.path,
        })
      })
      return finalResponse
    }
  }

  // --- Step 3: No session could be established ---
  console.error('[auth/callback] No session established')
  const isEmailVerification = type === 'signup' || next === '/verify-success'
  if (isEmailVerification) {
    return NextResponse.redirect(buildRedirectUrl('/login?verified=true'))
  }
  return NextResponse.redirect(buildRedirectUrl('/login?message=Sign+in+failed.+Please+try+again.'))
}
