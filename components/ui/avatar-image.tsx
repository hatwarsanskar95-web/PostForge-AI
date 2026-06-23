'use client'

import { useState } from 'react'

export function AvatarImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false)
  const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alt)}`

  if (!src || error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallback}
        alt={alt}
        className={className}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}
