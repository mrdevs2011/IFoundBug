import React from 'react';

/** IFB mark: white "IFB" on a black rounded square (the app's equivalent of the GitHub mark). */
export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="IFoundBug" className={className}>
      <rect width="512" height="512" rx="112" fill="#000" />
      <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="#f0f6fc" strokeOpacity=".28" strokeWidth="12" />
      <text x="256" y="322" textAnchor="middle" fontFamily="Helvetica,Arial,sans-serif" fontWeight="800" fontSize="196" letterSpacing="-8" fill="#fff">IFB</text>
    </svg>
  );
}
