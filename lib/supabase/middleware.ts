import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  const isDashboard = pathname.startsWith('/dashboard')
  const isLogin = pathname.startsWith('/login')
  const isSignup = pathname.startsWith('/signup')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isVerifySuccess = pathname.startsWith('/verify-success')
  const isUpdatePassword = pathname.startsWith('/update-password')
  const isCompleteMode = isLogin && searchParams.get('mode') === 'complete'
  const isEmailProvider = user?.app_metadata?.provider === 'email'
  const isConfirmed = !!user?.email_confirmed_at

  // Always allow auth routes and public pages to pass through
  if (isAuthCallback || isVerifySuccess || isUpdatePassword) {
    return supabaseResponse
  }

  // Helper: copy cookies from supabaseResponse to any redirect response
  const copyCookies = (targetResponse: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach(cookie => {
      targetResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
        path: cookie.path,
        domain: cookie.domain,
        expires: cookie.expires,
      })
    })
    return targetResponse
  }

  if (isDashboard) {
    // Not logged in at all
    if (!user) {
      return copyCookies(NextResponse.redirect(new URL('/login', request.url)))
    }
    // Logged in via email but email not confirmed yet — block access to dashboard
    if (isEmailProvider && !isConfirmed) {
      return copyCookies(NextResponse.redirect(new URL('/login?message=Please+verify+your+email+first', request.url)))
    }
  }

  // SPEC §12: Authenticated users on /login or /signup
  if ((isLogin || isSignup) && user) {
    // Email user not yet confirmed — let them stay to see the verification prompt
    if (isEmailProvider && !isConfirmed) {
      return supabaseResponse
    }

    // ONLY allow staying on /login?mode=complete (Google profile completion)
    if (isCompleteMode) {
      return supabaseResponse
    }

    // All other authenticated users (confirmed email OR Google with complete profile) → dashboard
    console.log('[AUTH DEBUG middleware] Confirmed user on auth page — redirecting to /dashboard', { pathname })
    return copyCookies(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  return supabaseResponse
}
