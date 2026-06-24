'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { BrandLogo } from '@/components/ui/brand-logo'

/* ── Animated wave + orb background ── */
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #070b18 0%, #0d1230 40%, #0a0e1a 100%)' }} />

      {/* Glow blobs */}
      <div className="absolute top-[8%] left-[10%] w-[500px] h-[500px] rounded-full opacity-25 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      <div className="absolute bottom-[5%] right-[5%] w-[420px] h-[420px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
      <div className="absolute top-[55%] left-[55%] w-[300px] h-[300px] rounded-full opacity-15 blur-[90px]"
        style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />

      {/* SVG waves */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ height: '38%', opacity: 0.18 }}
      >
        <path
          fill="#7c3aed"
          d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,197.3C672,203,768,181,864,160C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ height: '30%', opacity: 0.12 }}
      >
        <path
          fill="#06b6d4"
          d="M0,256L60,240C120,224,240,192,360,186.7C480,181,600,203,720,213.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>

      {/* Floating dots */}
      {[
        { top: '7%',  left: '20%', size: 13, color: '#ec4899', delay: 0 },
        { top: '15%', left: '78%', size: 10, color: '#06b6d4', delay: 0.8 },
        { top: '32%', left: '90%', size: 17, color: '#f59e0b', delay: 1.6 },
        { top: '62%', left: '8%',  size: 11, color: '#8b5cf6', delay: 0.4 },
        { top: '80%', left: '83%', size: 15, color: '#10b981', delay: 2.2 },
        { top: '88%', left: '45%', size: 8,  color: '#3b82f6', delay: 1.2 },
        { top: '50%', left: '4%',  size: 19, color: '#f43f5e', delay: 3.0 },
        { top: '25%', left: '50%', size: 7,  color: '#a78bfa', delay: 1.8 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-bounce"
          style={{
            top: dot.top, left: dot.left,
            width: dot.size, height: dot.size,
            background: dot.color,
            opacity: 0.65,
            animationDuration: '3.2s',
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Success screen ── */
function SuccessScreen() {
  useEffect(() => {
    // SPEC §13: After password reset success, redirect to /login
    const timer = setTimeout(() => {
      window.location.href = '/login'
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4">
      <AnimatedBackground />

      {/* Brand */}
      <div className="relative z-10 flex flex-col items-center gap-2 mb-8">
        <BrandLogo size="lg" showTagline />
      </div>

      <div className="relative z-10 w-full max-w-[390px] bg-[#0f1525]/90 border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center gap-5 backdrop-blur-md">
        {/* Shield icon with sparkles */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#0d1a2a] border border-white/10 flex items-center justify-center shadow-lg">
            <ShieldCheck size={38} className="text-emerald-400" />
          </div>
          <span className="absolute -top-1 -right-1 text-violet-300 text-xl">✦</span>
          <span className="absolute -bottom-1 -left-1 text-violet-300 text-xs">✦</span>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">Password Updated<br />Successfully</h2>
          <p className="text-sm text-white/50 mt-2 leading-relaxed">
            Your password has been updated. You&apos;ll be<br />redirected to sign in shortly.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }}
        >
          Sign In Now <ArrowRight size={16} />
        </Link>

        <p className="text-[11px] text-white/25">Redirecting to login automatically...</p>
      </div>

      <div className="relative z-10 mt-8 flex items-center gap-4 text-xs text-white/30">
        <Link href="/dashboard/settings" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/dashboard/settings" className="hover:text-white/60 transition-colors">Help Center</Link>
      </div>
    </div>
  )
}

/* ── Strength label ── */
function StrengthLabel({ password }: { password: string }) {
  if (!password) return null

  const len = password.length
  const hasSymOrNum = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  let label = ''
  let color = ''

  if (len < 8) {
    label = 'Too Short'; color = 'text-red-400'
  } else if (len < 12 || !hasSymOrNum) {
    label = 'Weak'; color = 'text-red-400'
  } else if (len < 16) {
    label = 'Moderate'; color = 'text-amber-400'
  } else {
    label = 'Strong'; color = 'text-emerald-400'
  }

  return (
    <span className={`text-[11px] font-bold ${color} transition-all`}>{label}</span>
  )
}

/* ── Main page ── */
export default function UpdatePasswordPage() {
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // We don't need a strict sessionReady blocker because with PKCE auth flow, 
  // the session is already established server-side before reaching this page.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setErrorMsg('Session not found or expired. You may need to request a new password reset link.')
      }
    })
  }, [supabase])

  // Validation — min 12 to match signup
  const hasMinLength = password.length >= 12
  const hasSymbolOrNumber = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const passwordsMatch = confirmPassword === password && password.length > 0
  const isValid = hasMinLength && hasSymbolOrNumber && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setStatus('loading')
    setErrorMsg('')

    // Use client-side Supabase so it has access to the recovery session from the browser
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      // Sign out other sessions — old password is now dead everywhere
      await supabase.auth.signOut({ scope: 'others' })
      setStatus('success')
    }
  }

  if (status === 'success') return <SuccessScreen />

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4">
      <style>{`
        input[type="password"]::-ms-reveal,input[type="password"]::-ms-clear{display:none!important}
        input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 30px #111827 inset!important;
          -webkit-text-fill-color:white!important;
          caret-color:white!important;
        }
      `}</style>

      <AnimatedBackground />

      {/* Brand */}
      <div className="relative z-10 flex flex-col items-center gap-2 mb-8">
        <BrandLogo size="lg" showTagline />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#0f1525]/90 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-white mb-1">Reset Your Password</h1>
        <p className="text-sm text-white/45 mb-7">
          Enter a strong new password for your Creator Pro account.
        </p>

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
            <p className="text-sm text-red-300">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">New Password</label>
              <StrengthLabel password={password} />
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Only show error hint when user has started typing and length < 12 */}
            {password.length > 0 && password.length < 12 && (
              <p className="text-[11px] text-red-400 pl-1">Password must be at least 12 characters</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-red-400 pl-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid || status === 'loading'}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #6d28d9)' }}
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight size={13} />
                  </div>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2">
            Back to Login
          </Link>
        </div>
      </div>

      <p className="relative z-10 mt-6 text-[11px] text-white/25">Securely managed by PostForge Auth Engine.</p>
    </div>
  )
}
