/**
 * Shared PostForge AI brand logo component.
 * Matches the official branding: cart+lightbulb circle, POST white, FORGE violet, AI badge.
 * Optional tagline: "IDEAS. CRAFTED. DELIVERED."
 */

import React from 'react'

interface BrandLogoProps {
  /** Show the tagline below the name */
  showTagline?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BrandLogo({ showTagline = false, size = 'md', className = '' }: BrandLogoProps) {
  const iconSizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }
  const svgSizes  = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
  const textSizes = { sm: 'text-lg',  md: 'text-xl',  lg: 'text-3xl' }
  const badgeSizes = { sm: 'text-[9px] px-1 py-0.5', md: 'text-[10px] px-1.5 py-0.5', lg: 'text-[13px] px-2 py-1' }
  const taglineSizes = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs' }

  return (
    <div className={`flex flex-col items-start gap-0.5 ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* Circle logo: cart + lightbulb */}
        <div
          className={`${iconSizes[size]} rounded-full flex items-center justify-center flex-shrink-0`}
          style={{
            background: 'radial-gradient(circle at 40% 40%, #6d28d9, #3b0764)',
            border: '1.5px solid rgba(168,85,247,0.7)',
            boxShadow: '0 0 16px rgba(124,58,237,0.55)',
          }}
        >
          <svg className={`${svgSizes[size]} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {/* Cart */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M9 19a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
            {/* Lightbulb */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4"
              d="M12 7.5a1.8 1.8 0 110 0z" fill="currentColor" opacity="0.8" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M12 7.5v1.2" />
          </svg>
        </div>

        {/* Brand name */}
        <div className="flex items-center gap-0.5">
          <span className={`${textSizes[size]} font-black text-white tracking-tight uppercase leading-none`}>POST</span>
          <span className={`${textSizes[size]} font-black text-violet-400 tracking-tight uppercase leading-none`}>FORGE</span>
          <span
            className={`ml-1 ${badgeSizes[size]} font-extrabold text-violet-300 border border-violet-500/70 rounded leading-none`}
          >
            AI
          </span>
        </div>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p className={`${taglineSizes[size]} tracking-[0.22em] text-violet-400/70 font-semibold uppercase pl-[calc(${iconSizes[size]}+10px)] mt-0.5`}
          style={{ paddingLeft: size === 'sm' ? 42 : size === 'md' ? 50 : 66 }}>
          — IDEAS. CRAFTED. DELIVERED. —
        </p>
      )}
    </div>
  )
}
