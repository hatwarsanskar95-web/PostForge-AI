'use client'

import { CheckCircle2 } from 'lucide-react'
import { BrandLogo } from '@/components/ui/brand-logo'
import { useRouter } from 'next/navigation'

export default function VerifySuccessPage() {
  const router = useRouter()

  return (
    <div className="bg-black min-h-screen w-full flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 w-full flex justify-center pt-10">
        <div className="flex items-center">
          <BrandLogo size="md" />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-md w-full bg-zinc-900/50 border border-white/10 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-md mt-16">
        <div className="bg-green-500/10 p-4 rounded-full mb-8">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>

        <h1 className="text-3xl font-semibold text-white mb-4 tracking-tight">
          Verification Successful
        </h1>

        <p className="text-white/60 text-base leading-relaxed mb-8">
          Your email has been verified successfully. You can now log in to your account and access your dashboard.
        </p>

        <button
          onClick={() => router.push('/login')}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-base transition-all shadow-lg hover:shadow-violet-500/25"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}
