import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvatarImage } from '@/components/ui/avatar-image'
import { BrandLogo } from "@/components/ui/brand-logo"
import { SettingsDropdown } from "@/components/ui/settings-dropdown"
import { CreatorSuiteInteractive } from "@/components/ui/creator-suite-interactive"
import { getUserUsageStats } from "@/app/actions/usage"
import AnimatedShaderBackground from "@/components/ui/animated-shader-background"
import { CreditIndicator } from "@/components/ui/credit-indicator"
import { SubscriptionCard } from "@/components/ui/subscription-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const username = profile?.username || '@user'
  const avatarId = profile?.avatar_id || 'boy-1'

  const avatarSrc = `/avatars/${avatarId}.${avatarId.endsWith('-4') ? 'svg' : 'png'}`

  const usageStats = await getUserUsageStats();
  const isPaid = usageStats?.plan?.plan_slug && usageStats?.plan?.plan_slug !== 'free';
  const planName = usageStats?.plan?.plan_name || 'Free';
  const remaining = usageStats?.remaining ?? 0;
  const limit = usageStats?.plan?.generation_limit ?? 3;

  return (
    <>
      <AnimatedShaderBackground />
      <style dangerouslySetInnerHTML={{__html: `
        .panel-bg-overlay {
          background-image: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAbLskW_keAcokIEwXA69nmpg92pldG5dUEvnWHFjbsz38EEEfzeiL6L8jdDujd4cdssk-aOCl63dvz_rzDL05ycVY8Dt9emngAuqa66fSYJF5whLLZZapoUefN04FjVirZ3rSudZ3u6u95kr5gHgq3qNfvpxoLEEZcKdvdF1gQFvPQ8i_i4mslzQxOW_8Grcp2bAKhlYhueU0a_4_qEsyznPjRYCOo5VgmeF6qlUAlG8SeA3TFRQXIGVV3kfpis6HN9gLcXPRzvcIM');
          background-size: cover;
          background-position: center;
        }
    
        .glass-morphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
    
        /* Circular Navigation Styles */
        .node-orbit {
          position: relative;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
    
        /* Rotation Container */
        .feature-wheel-wrapper {
          position: relative;
          width: 500px;
          height: 500px;
          animation: rotate-slow 40s linear infinite;
        }
    
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
    
        .node-item {
          position: absolute;
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
        }
    
        /* Counter-rotation to keep text and icons upright */
        .counter-rotate {
          animation: rotate-slow-reverse 40s linear infinite;
        }
    
        @keyframes rotate-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
    
        .node-icon-wrapper {
          width: 52px;
          height: 52px;
          background: radial-gradient(circle at center, #2e1065, #1e1040, #0a0520);
          border: 1.5px solid rgba(139, 92, 246, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 18px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(124, 58, 237, 0.15);
        }
    
        .node-icon-wrapper:hover {
          border-color: #a855f7;
          box-shadow: 0 0 28px rgba(168, 85, 247, 0.65), inset 0 0 14px rgba(124, 58, 237, 0.25);
          transform: scale(1.1);
        }
    
        .center-glow {
          background: radial-gradient(circle at center, #7c3aed, #4f46e5, transparent);
          filter: blur(20px);
          opacity: 0.6;
        }
    
        .connecting-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.85;
          z-index: 1;
        }
      `}} />
      <div className="min-h-screen flex flex-col text-white font-sans relative z-10" style={{ background: 'rgba(0,0,0,0.55)' }}>
        {/* MainHeader */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black z-50">
          {/* Logo Section */}
          <div className="flex items-center">
            <BrandLogo size="sm" />
          </div>
          {/* Right Side Navigation */}
          <div className="flex items-center space-x-6">
            <CreditIndicator />
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span className="hidden sm:block">{username}</span>
              <AvatarImage src={avatarSrc} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
            </div>
            <SettingsDropdown />
          </div>
        </header>

        {/* MainContent */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto">
          {/* UserBanner */}
          <section className="max-w-7xl mx-auto rounded-3xl overflow-hidden panel-bg-overlay relative border border-white/5" data-purpose="user-welcome-banner">
            <div className="px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <AvatarImage src={avatarSrc} alt={displayName} className="w-20 h-20 rounded-full object-cover shadow-lg border border-white/20" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {displayName} 👋</h1>
                  <p className="text-gray-400 text-sm mt-1">{username} · {user.email}</p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-3">
                <div className="flex items-center space-x-2 bg-green-950/30 border border-green-500/30 px-4 py-1.5 rounded-full w-fit">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-green-400 text-xs font-medium tracking-wide">Creator Account</span>
                </div>
                
                <SubscriptionCard />
              </div>
            </div>
          </section>

          {/* CreatorSuite */}
          <CreatorSuiteInteractive />
        </main>

      </div>
    </>
  )
}
