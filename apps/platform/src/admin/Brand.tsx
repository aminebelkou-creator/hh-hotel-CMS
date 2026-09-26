import React from 'react'

/** Our mark: a key in a rounded square (navy and champagne), drawn here, no image file. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#16233f" />
      <circle cx="12.5" cy="15" r="4.6" fill="none" stroke="#d8b56b" strokeWidth="2.4" />
      <path d="M16.6 15h9.4M23 15v3.6M20 15v2.6" fill="none" stroke="#d8b56b" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Login screen logo. */
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark size={44} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>Hotel website</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Your site, your words, online in one click</div>
      </div>
    </div>
  )
}

/** Small mark in the top bar. */
export function Icon() {
  return <Mark size={28} />
}

/** A line of help under the login logo. */
export function LoginIntro() {
  return (
    <p style={{ margin: '0 0 8px', fontSize: 14, opacity: 0.8, lineHeight: 1.5 }}>
      Sign in with the email address your platform contact gave you. Lost your password? Ask them for a new one.
    </p>
  )
}
