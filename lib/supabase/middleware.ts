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

  if (isLogin && user) {
    // Email user not yet confirmed — let them stay to see the verification prompt
    if (isEmailProvider && !isConfirmed) {
      return supabaseResponse
    }
    const isVerifiedQuery = searchParams.get('verified') === 'true'
    // User is in profile-completion mode (Google first-time signup) or seeing verification success
    if (isCompleteMode || isVerifiedQuery) {
      return supabaseResponse
    }
    // Fully authenticated — redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
