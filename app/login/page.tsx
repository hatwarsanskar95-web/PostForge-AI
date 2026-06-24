'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthComponent, SignupData } from "@/components/ui/sign-up"
import { createClient } from '@/lib/supabase/client'
import { signup, login, completeProfile, resetPassword, resendVerificationEmail } from './actions'

const CustomLogo = () => (
  <div className="bg-blue-600 rounded-lg p-2">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  </div>
);

function LoginContent() {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode')
  const isCompleteMode = modeParam === 'complete'
  const isSignupMode = modeParam === 'signup'
  const isVerified = searchParams.has('verified')

  const [defaultEmail, setDefaultEmail] = useState('')
  const [defaultName, setDefaultName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('')
  const [debugText, setDebugText] = useState('Initializing (v2)...')
  const [supabaseClient, setSupabaseClient] = useState<any>(null)

  useEffect(() => {
    let supabase: any;
    try {
      supabase = createClient();
      setSupabaseClient(supabase);
    } catch (e: any) {
      console.error('[Auth] Failed to initialize Supabase client:', e);
    }

    let pendingEmail = null
    try {
      pendingEmail = sessionStorage.getItem('pendingVerificationEmail')
    } catch (e) {
      console.warn('[Auth] sessionStorage access denied:', e)
    }

    if (pendingEmail) {
      if (isVerified) {
        try {
          sessionStorage.removeItem('pendingVerificationEmail')
        } catch (e) {
          console.warn('[Auth] sessionStorage access denied:', e)
        }
        pendingEmail = null
      } else {
        setPendingVerificationEmail(pendingEmail)
        setIsLoading(false)
        return
      }
    }

    // Check for Supabase hash errors (e.g. #error_code=otp_expired)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const errorCode = hashParams.get('error_code')
      if (errorCode === 'otp_expired') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setLoadingError('Verification link expired or already used. If you or your email scanner already clicked it, your email might be verified! Try logging in below or wait 1 minute to request a new link.')
        setIsLoading(false)
        return
      }
    }

    if (!isCompleteMode) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false)
    }, 5000)

    if (supabase) {
      supabase.auth.getUser().then(({ data, error }: any) => {
        if (!isMounted) return
        clearTimeout(timeoutId)
        
        const user = data?.user
        if (user) {
          setDefaultEmail(user.email || '')
          const metaName = user.user_metadata?.full_name || user.user_metadata?.name || ''
          setDefaultName(metaName)
        }
        setIsLoading(false)
      }).catch(() => {
        if (!isMounted) return
        clearTimeout(timeoutId)
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleteMode])

  const handleGoogleSignIn = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleEmailSubmit = async (data: SignupData | { email: string; password: string }) => {
    if (!('fullName' in data)) {
      const result = await login(data.email, data.password)
      if (result.type === 'check_email') return { error: null, type: 'check_email' }
      return { error: result.error }
    }
    const signupData = data as SignupData
    if (isCompleteMode) {
      const result = await completeProfile({
        fullName: signupData.fullName, username: signupData.username, mobileNumber: signupData.mobileNumber, linkedinUrl: signupData.linkedinUrl, avatarId: signupData.avatarId,
      })
      return result.error
    }
    const result = await signup({
      email: signupData.email, password: signupData.password, fullName: signupData.fullName, username: signupData.username, mobileNumber: signupData.mobileNumber, linkedinUrl: signupData.linkedinUrl, avatarId: signupData.avatarId,
    })
    if (result.error && result.error.toLowerCase().includes('already registered')) return { error: 'Account has been already created with this email.' }
    // For email signups, profile is created in /auth/callback after the user verifies their email.
    // Do NOT call completeProfile here — the auth user may not be confirmed yet (FK constraint).
    if (result.type === 'check_email') return { error: null, type: 'check_email' }
    return { error: result.error }
  }

  const handleResetPassword = async (email: string) => {
    const result = await resetPassword(email)
    return result.error
  }

  const handleResendEmail = async (email: string) => {
    const result = await resendVerificationEmail(email)
    return result.error
  }
  if (loadingError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <div className="bg-red-900/20 text-red-400 border border-red-900/50 p-6 rounded-lg text-center max-w-md">
          <p className="font-semibold mb-2">Session Error</p>
          <p className="text-sm opacity-90">{loadingError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-mono p-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-lg mb-2">Loading...</p>
        <p className="text-xs text-neutral-500 whitespace-pre-wrap text-center max-w-md">
          {debugText}
        </p>
      </div>
    )
  }

  return (
    <AuthComponent
      logo={<CustomLogo />}
      brandName="PostForge AI"
      onGoogleSignIn={handleGoogleSignIn}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onEmailSubmit={handleEmailSubmit as any}
      onResetPassword={handleResetPassword}
      onResendEmail={handleResendEmail}
      initialMode={isCompleteMode ? 'complete' : isSignupMode ? 'signup' : 'initial'}
      defaultEmail={defaultEmail}
      defaultName={defaultName}
      pendingVerificationEmail={pendingVerificationEmail}
      isVerified={isVerified}
    />
  )
}

class ErrorBoundary extends React.Component<{ fallback: (error: Error) => React.ReactNode, children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error!)
    }
    return this.props.children
  }
}

export default function LoginPage() {
  return (
    <ErrorBoundary fallback={(error) => (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 p-4">
        <h1 className="text-xl font-bold mb-4">Hydration / Render Error</h1>
        <p className="text-sm font-mono whitespace-pre-wrap">{error.toString()}</p>
        <p className="text-xs font-mono mt-4 opacity-50">{error.stack}</p>
      </div>
    )}>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <LoginContent />
      </Suspense>
    </ErrorBoundary>
  )
}
