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

  if (isDashboard) {
    // Not logged in at all
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Logged in via email but email not confirmed yet — block access to dashboard
    if (isEmailProvider && !isConfirmed) {
      return NextResponse.redirect(new URL('/login?message=Please+verify+your+email+first', request.url))
    }
  }

  // SPEC §12: Authenticated users on /login or /signup must be redirected to /dashboard
  if ((isLogin || isSignup) && user) {
    const isVerifiedQuery = searchParams.get('verified') === 'true'

    console.log('[AUTH DEBUG middleware]', {
      userEmail: user.email,
      provider: user.app_metadata?.provider,
      isEmailProvider,
      isConfirmed,
      isCompleteMode,
      isVerifiedQuery,
      pathname,
    })

    // Email user not yet confirmed — let them stay to see the verification prompt
    if (isEmailProvider && !isConfirmed) {
      return supabaseResponse
    }

    // ONLY allow staying on /login?mode=complete (Google profile completion)
    if (isCompleteMode) {
      return supabaseResponse
    }

    // SPEC §12: All other authenticated users (confirmed email OR Google) → dashboard
    // This applies to both /login and /signup
    console.log('[AUTH DEBUG middleware] Confirmed user on auth page — redirecting to /dashboard', { pathname })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
