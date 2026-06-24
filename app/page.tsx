'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { WebGLShader } from "@/components/ui/web-gl-shader"
import Link from "next/link"
import { BrandLogo } from "@/components/ui/brand-logo"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect mobile once on mount — used to skip heavy WebGL/Spline on mobile
    setIsMobile(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    
    // Check for Implicit flow hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash.includes('access_token=') || hash.includes('token_hash=')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const hashType = hashParams.get('type')
        if (hashType === 'signup') {
          // Genuine email verification via magic link / OTP
          // SPEC §4: redirect to /login?verified=true — NEVER include mode=signup
          console.log('[home] Email verification hash detected — showing verified popup')
          router.replace('/login?verified=true')
        } else if (hashType === 'recovery') {
          // Password reset token — must go to update-password, NOT signup form
          console.log('[home] Password recovery hash detected — routing to auth callback with update-password')
          router.replace('/auth/callback' + hash.replace('#', '?') + '&next=/update-password')
        } else {
          // Google OAuth or other provider implicit flow — route to auth callback
          console.log('[home] OAuth token in hash (type=' + hashType + ') — routing to auth callback')
          router.replace('/auth/callback' + hash)
        }
        return
      }
    }

    // Supabase site-URL fallback: query params contain code or token_hash
    // CRITICAL: 'code' is the PKCE param used by Google OAuth.
    //   → Do NOT append next=/verify-success for code flows. Let /auth/callback
    //     decide the destination based on the provider (Google → /dashboard).
    // 'token_hash' is the email OTP param.
    //   → Safe to append next=/verify-success because this is always email verification.
    if (code) {
      console.log('[home] PKCE code detected (Google OAuth site-URL fallback) — routing to auth callback without verify-success')
      router.replace(`/auth/callback?${searchParams.toString()}`)
      return
    }
    if (tokenHash) {
      // Distinguish recovery (password reset) from signup (email verification).
      // CRITICAL: appending next=/verify-success to a recovery token sends
      // the user to the login/signup form instead of the password update page.
      const tokenType = searchParams.get('type')
      if (tokenType === 'recovery') {
        console.log('[home] Password reset token_hash detected — routing to auth callback with update-password')
        router.replace(`/auth/callback?${searchParams.toString()}&next=/update-password`)
      } else {
        console.log('[home] Email OTP token_hash detected — routing to auth callback with verify-success')
        router.replace(`/auth/callback?${searchParams.toString()}&next=/verify-success`)
      }
      return
    }

    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    if (error || errorCode) {
      // OAuth failed — redirect to login with a user-friendly message
      if (errorCode === 'bad_oauth_state') {
        router.replace('/login?message=Google+sign-in+session+expired.+Please+try+again.')
      } else {
        router.replace('/login?message=Sign-in+failed.+Please+try+again.')
      }
    }
  }, [searchParams, router])

  return (
    <div className="flex w-full min-h-screen justify-center items-center bg-black p-4 md:p-8">
      <style>{`
        @keyframes robotZoomOut {
          0%   { transform: scale(2.2); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .robot-zoom-out {
          animation: robotZoomOut 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <Card className="w-full md:h-[600px] max-w-7xl rounded-2xl bg-black/[0.96] relative overflow-hidden border-zinc-800">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />

        {/* Rainbow wave shader background — single instance on mobile, double on desktop */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-70 mix-blend-screen">
            <WebGLShader />
          </div>
          {/* Force second instance on mobile too as requested by user */}
          <div className="absolute inset-0 opacity-40 mix-blend-screen blur-[6px] scale-105">
            <WebGLShader />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row min-h-[600px] md:h-full relative z-10">
          {/* Left content */}
          <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-8">
              <BrandLogo size="md" showTagline />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
              Welcome to PostForge AI
            </h1>
            <p className="mt-6 text-neutral-300 max-w-lg text-lg">
              PostForge AI is an AI-powered platform that helps professionals, students, and creators generate engaging LinkedIn posts in seconds. Simply provide your topic, audience, or experience, and PostForge AI transforms it into a well-structured, professional post designed to boost visibility, engagement, and personal branding.
            </p>
            
            <div className="mt-10 flex flex-col gap-6">
              <div>
                <a
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-bold text-black shadow transition-colors hover:bg-neutral-200"
                >
                  Get Started
                </a>
              </div>
              <p className="text-lg font-bold">
                <span className="text-red-500 drop-shadow-md">Disclaimer:</span> <span className="text-white">- For better Access to This website Open in PC or Laptop</span>
              </p>
            </div>
          </div>

          {/* Right content — 3D robot animation (forced on mobile as per user request) */}
          <div className="flex w-full h-[400px] md:flex-1 md:h-full relative overflow-hidden">
            <div className="robot-zoom-out w-full h-full">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Desktop Mode Popup */}
      {isMobile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-3xl">💻</div>
            <h2 className="text-xl font-bold text-white mb-2">Desktop Site Recommended</h2>
            <p className="text-zinc-400 mb-6 text-sm">To experience all 3D animations and features correctly, please enable <strong>"Desktop Site"</strong> in your browser settings (usually in the aA or three-dots menu).</p>
            <button onClick={() => setIsMobile(false)} className="bg-white text-black font-bold py-3 px-6 rounded-full w-full hover:bg-neutral-200 transition-colors">
              I've enabled it (Continue)
            </button>
          </div>
        </div>
      )}
    </div>

  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  )
}
